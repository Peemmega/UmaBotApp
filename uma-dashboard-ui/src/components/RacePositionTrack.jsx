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

function getProgressRatio(player, finishDistance) {
  const explicitRatio = Number(player?.progress_ratio);
  if (Number.isFinite(explicitRatio)) return clamp(explicitRatio, 0, 1);

  const distance = Number(player?.distance);
  if (Number.isFinite(distance)) {
    const finish = Math.max(1, Number(finishDistance) || 1);
    return clamp(distance / finish, 0, 1);
  }

  const fallbackScore = Number(player?.score);
  const finish = Math.max(1, Number(finishDistance) || 1);
  return clamp((Number.isFinite(fallbackScore) ? fallbackScore : 0) / finish, 0, 1);
}

function getStackOffset(indexInCluster) {
  if (indexInCluster <= 0) return 0;
  const direction = indexInCluster % 2 === 1 ? -1 : 1;
  const level = Math.ceil(indexInCluster / 2);
  return direction * level * STACK_STEP_PX;
}

function buildTrackPlayers(players, finishDistance) {
  const basePlayers = (Array.isArray(players) ? players : []).map((player, index) => ({
    ...player,
    display_number: Number(player?.display_number) || index + 1,
    progressRatio: getProgressRatio(player, finishDistance),
    runningStyleKey: normalizeRunningStyle(player?.running_style || player?.style),
  }));

  const rankedPlayers = [...basePlayers]
    .sort((left, right) => (
      right.progressRatio - left.progressRatio ||
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

export default function RacePositionTrack({ players, finishDistance, currentUserId }) {
  const trackPlayers = useMemo(
    () => buildTrackPlayers(players, finishDistance),
    [finishDistance, players]
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
            <div className="race-player-marker" title={`${player.name || "Racer"}: ${Number(player.distance) || 0}m`}>
              <span>{player.display_number}</span>
            </div>
            {player.zone_active ? <small>ZONE</small> : null}
          </div>
        );
      })}
    </section>
  );
}
