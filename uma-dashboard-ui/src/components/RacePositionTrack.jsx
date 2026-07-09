import { useEffect, useMemo, useRef, useState } from "react";

export const TRACK_STYLE_COLORS = {
  front: "#32c56a",
  pace: "#3f8cff",
  late: "#ff9f40",
  end: "#ff5b5b",
};

const STACK_THRESHOLD = 0.03;
const STACK_STEP_PX = 10;
export const LANE_COUNT = 6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRunningStyle(value) {
  const key = String(value || "").trim().toLowerCase();
  return TRACK_STYLE_COLORS[key] ? key : "pace";
}

function getPlayerScore(player) {
  return Number(player?.distance ?? player?.score ?? player?.total_score ?? 0);
}

function getRelativePlayerProgress(player, players) {
  const scoreList = (Array.isArray(players) ? players : []).map(getPlayerScore);
  const minScore = Math.min(...scoreList);
  const maxScore = Math.max(...scoreList);
  const range = maxScore - minScore;

  if (range <= 0) return 0.5;

  const value = getPlayerScore(player);
  const normalized = (value - minScore) / range;
  return clamp(0.08 + normalized * 0.84, 0.08, 0.92);
}

function getStackOffset(indexInCluster) {
  if (indexInCluster <= 0) return 0;
  const direction = indexInCluster % 2 === 1 ? -1 : 1;
  const level = Math.ceil(indexInCluster / 2);
  return direction * level * STACK_STEP_PX;
}

function getLaneCenterY(lane) {
  return 12 + (clamp(Number(lane) || 1, 1, LANE_COUNT) - 1) * 15;
}

export function buildTrackPlayers(players, room) {
  const basePlayers = (Array.isArray(players) ? players : []).map((player, index) => ({
    ...player,
    display_number: Number(player?.display_number) || index + 1,
    progressRatio: getRelativePlayerProgress(player, players),
    numericScore: getPlayerScore(player),
    runningStyleKey: normalizeRunningStyle(player?.running_style || player?.style),
    markerLane: clamp(Number(player?.current_lane) || 1, 1, LANE_COUNT),
  }));

  const rankedPlayers = [...basePlayers]
    .sort((left, right) => (
      right.progressRatio - left.progressRatio ||
      right.numericScore - left.numericScore ||
      left.display_number - right.display_number
    ))
    .map((player, index) => ({
      ...player,
      rank: Number(player?.rank) || index + 1,
    }));

  const offsetsById = new Map();
  const clusteredPlayers = [...rankedPlayers].sort((left, right) => (
    left.markerLane - right.markerLane ||
    left.progressRatio - right.progressRatio ||
    left.display_number - right.display_number
  ));

  let clusterDepth = 0;
  for (let index = 0; index < clusteredPlayers.length; index += 1) {
    const current = clusteredPlayers[index];
    const previous = clusteredPlayers[index - 1];

    if (previous && previous.markerLane === current.markerLane && Math.abs(current.progressRatio - previous.progressRatio) < STACK_THRESHOLD) {
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
      markerLaneY: getLaneCenterY(player.markerLane),
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
      <div className="race-position-lanes" aria-hidden="true">
        {Array.from({ length: LANE_COUNT }, (_, index) => (
          <div
            key={index + 1}
            className="race-position-lane"
            style={{ "--lane-y": `${getLaneCenterY(index + 1)}%` }}
          />
        ))}
      </div>

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
              "--lane-y": `${player.markerLaneY}%`,
            }}
          >
            <div
              className="race-player-marker"
              title={
                `${player.name || "Racer"} | Score ${player.numericScore} | Rank ${Number(player.rank) || "-"}`
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
