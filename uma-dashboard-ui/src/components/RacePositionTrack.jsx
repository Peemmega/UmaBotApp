import { useEffect, useMemo, useRef, useState } from "react";

const TRACK_STYLE_COLORS = {
  front: "#32c56a",
  pace: "#3f8cff",
  late: "#ff9f40",
  end: "#ff5b5b",
};

const STACK_THRESHOLD = 0.03;
const STACK_STEP_PX = 24;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRunningStyle(value) {
  const key = String(value || "").trim().toLowerCase();
  return TRACK_STYLE_COLORS[key] ? key : "pace";
}

function getPlayerProgress(player, room) {
  const finishDistance = Number(room?.finish_distance);
  if (room?.race_mode === "web_timing" || Number.isFinite(finishDistance)) {
    const distanceScore = Number(player?.distance ?? player?.score ?? 0);
    return clamp(distanceScore / Math.max(1, finishDistance || 1), 0.02, 0.98);
  }

  const currentTurn = Number(room?.current_turn ?? room?.turn ?? 0);
  const totalTurns = Number(room?.max_turn ?? room?.total_turns ?? room?.turns ?? 12);
  const turnProgress = totalTurns > 0 ? currentTurn / totalTurns : 0;
  const roomPlayers = Array.isArray(room?.players) ? room.players : [];
  const maxScore = Math.max(
    ...roomPlayers.map((entry) => Number(entry?.score ?? entry?.total_score ?? 0)),
    1
  );
  const playerScore = Number(player?.score ?? player?.total_score ?? 0);
  const scoreRatio = playerScore / maxScore;

  return clamp(turnProgress * 0.85 + scoreRatio * 0.15, 0.02, 0.98);
}

function getStackOffset(indexInCluster) {
  if (indexInCluster <= 0) return 0;
  const direction = indexInCluster % 2 === 1 ? -1 : 1;
  const level = Math.ceil(indexInCluster / 2);
  return direction * level * STACK_STEP_PX;
}

function buildTrackPlayers(players, room) {
  const basePlayers = (Array.isArray(players) ? players : []).map((player, index) => ({
    ...player,
    display_number: Number(player?.display_number) || index + 1,
    progressRatio: getPlayerProgress(player, room),
    runningStyleKey: normalizeRunningStyle(player?.running_style || player?.style),
  }));

  const rankedPlayers = [...basePlayers]
    .sort((left, right) => (
      right.progressRatio - left.progressRatio ||
      (Number(right.score ?? right.total_score) || 0) - (Number(left.score ?? left.total_score) || 0) ||
      (Number(right.distance) || 0) - (Number(left.distance) || 0) ||
      left.display_number - right.display_number
    ))
    .map((player, index) => ({
      ...player,
      rank: Number(player?.rank) || index + 1,
    }));

  const offsetsById = new Map();
  const clusteredPlayers = [...rankedPlayers].sort((left, right) => (
    left.progressRatio - right.progressRatio ||
    left.display_number - right.display_number
  ));

  let clusterDepth = 0;
  for (let index = 0; index < clusteredPlayers.length; index += 1) {
    const current = clusteredPlayers[index];
    const previous = clusteredPlayers[index - 1];

    if (previous && Math.abs(current.progressRatio - previous.progressRatio) < STACK_THRESHOLD) {
      clusterDepth += 1;
    } else {
      clusterDepth = 0;
    }

    offsetsById.set(String(current.id ?? current.user_id ?? current.display_number), getStackOffset(clusterDepth));
  }

  return rankedPlayers.map((player) => {
    const playerId = String(player.id ?? player.user_id ?? player.display_number);
    return {
      ...player,
      markerColor: TRACK_STYLE_COLORS[player.runningStyleKey],
      markerProgress: player.progressRatio,
      markerOffsetY: offsetsById.get(playerId) || 0,
      playerKey: playerId,
    };
  });
}

export default function RacePositionTrack({ players, room, currentUserId }) {
  const trackPlayers = useMemo(
    () => buildTrackPlayers(players, room),
    [players, room]
  );
  const previousRanksRef = useRef(new Map());
  const [overtakeIds, setOvertakeIds] = useState([]);

  useEffect(() => {
    const overtakes = [];
    const nextRanks = new Map();

    trackPlayers.forEach((player) => {
      const previousRank = previousRanksRef.current.get(player.playerKey);
      if (previousRank && player.rank < previousRank) {
        overtakes.push(player.playerKey);
      }
      nextRanks.set(player.playerKey, player.rank);
    });

    previousRanksRef.current = nextRanks;
    if (overtakes.length === 0) return undefined;

    setOvertakeIds((current) => [...new Set([...current, ...overtakes])]);
    const timeoutId = window.setTimeout(() => {
      setOvertakeIds((current) => current.filter((id) => !overtakes.includes(id)));
    }, 460);

    return () => window.clearTimeout(timeoutId);
  }, [trackPlayers]);

  return (
    <section className="race-position-track" aria-label="Live player positions">
      <div className="race-position-track__dev-label">POSITION TRACK ACTIVE</div>
      <div className="race-position-track__label is-start">START</div>
      <div className="race-position-track__label is-finish">FINISH</div>
      <div className="race-position-lane" aria-hidden="true" />

      {trackPlayers.map((player) => {
        const isSelf =
          String(player.id ?? player.user_id ?? "") === String(currentUserId);
        const isOvertaking = overtakeIds.includes(player.playerKey);

        return (
          <div
            key={player.playerKey}
            className={[
              "race-track-marker-wrap",
              player.zone_active ? "is-zone-active" : "",
              isSelf ? "is-self" : "",
              isOvertaking ? "is-overtaking" : "",
            ].filter(Boolean).join(" ")}
            style={{
              "--progress": player.markerProgress,
              "--track-offset-y": `${player.markerOffsetY}px`,
              "--track-marker-color": player.markerColor,
            }}
          >
            <div
              className="race-player-marker"
              title={
                room?.race_mode === "web_timing"
                  ? `${player.name || "Racer"}: ${Number(player.distance ?? player.score) || 0}m`
                  : `${player.name || "Racer"} | Turn ${Number(room?.current_turn ?? room?.turn ?? 0)} / ${Number(room?.max_turn ?? room?.total_turns ?? room?.turns ?? 12)} | Score ${Number(player.score ?? player.total_score ?? 0)} | Rank ${Number(player.rank) || "-"}`
              }
            >
              <span>{player.display_number}</span>
            </div>
            {player.zone_active ? <small>ZONE</small> : null}
          </div>
        );
      })}
    </section>
  );
}
