const laneOf = (value) => Math.min(6, Math.max(1, Number(value) || 1));
const defaultLaneFromEntry = (entryNumber) => {
  const entry = Math.max(1, Number(entryNumber) || 1);
  return laneOf(Math.floor((entry - 1) / 2) + 1);
};

function objectData(value) {
  if (typeof value !== "string") return value || {};
  try { return JSON.parse(value) || {}; } catch { return {}; }
}

function laneFromTurn(turn, fallback = 1) {
  const data = getReplayTurnData(turn);
  const laneChange = data.lane_change ?? data.roll?.lane_change;
  const recordedLane = laneChange?.to ?? data.roll?.current_lane ?? turn?.lane;
  return recordedLane == null ? fallback : laneOf(recordedLane);
}

export function getReplayTurnData(turn) {
  return objectData(turn?.turn_data ?? turn?.turn_data_json);
}

export function formatReplayAction(action) {
  const data = objectData(action?.action_data ?? action?.action_data_json);
  const type = String(action?.action_type || "").toLowerCase();
  switch (type) {
    case "skill": return `ใช้สกิล ${data.skill_name || data.skill_id || "ไม่ระบุชื่อ"}`;
    case "lane_change": return `เปลี่ยนเลน ${data.from_lane ?? data.from ?? "?"} → ${data.to_lane ?? data.to ?? "?"}`;
    case "lane_change_queued": return `เตรียมเปลี่ยนเลน ${data.from_lane ?? "?"} → ${data.to_lane ?? "?"}`;
    case "zone": return `ใช้ Zone${data.zone_name ? ` ${data.zone_name}` : ""}`;
    case "rush": return `ใช้ Rush เพิ่ม ${data.move_forward ?? 0} คะแนน`;
    case "block": return `ใช้ Block ถอย ${data.move_back ?? 0} คะแนน`;
    case "blocked": return `Blocked ระหว่างวิ่ง${data.blocked_count ? ` · ผ่านคู่แข่งในเลนเดียวกัน ${data.blocked_count} คน` : ""}`;
    case "draft": return "ได้รับโบนัส Draft";
    case "reroll": return `ทอยใหม่${data.rerolls_left != null ? ` · เหลือ ${data.rerolls_left} ครั้ง` : ""}`;
    case "timing": return `Timing ${data.timing_tier || ""} · เคลื่อนที่ +${data.distance_gain ?? 0}`;
    default: return data.summary || action?.action_type || "การกระทำ";
  }
}

export function buildReplayState(participants, turns, selectedTurn, avatars = {}) {
  const histories = new Map();
  for (const turn of turns) {
    const id = String(turn.participant_id);
    if (!histories.has(id)) histories.set(id, []);
    histories.get(id).push(turn);
  }
  for (const history of histories.values()) history.sort((a, b) => Number(a.turn_number) - Number(b.turn_number));

  const players = participants.map((participant, index) => {
    const id = String(participant.participant_id);
    const history = histories.get(id) || [];
    const latest = history.filter((turn) => Number(turn.turn_number) <= selectedTurn).at(-1);
    const turn = Number(latest?.turn_number) === selectedTurn ? latest : null;
    const roll = getReplayTurnData(turn).roll || {};
    const color = String(roll.distance_color || "").toLowerCase();
    const firstTurnData = getReplayTurnData(history[0]);
    const firstLaneChange = firstTurnData.lane_change ?? firstTurnData.roll?.lane_change;
    let currentLane = laneOf(
      firstLaneChange?.from
        ?? participant.initial_lane
        ?? defaultLaneFromEntry(participant.entry_number),
    );
    for (const historyTurn of history) {
      if (Number(historyTurn.turn_number) > selectedTurn) break;
      currentLane = laneFromTurn(historyTurn, currentLane);
    }
    return {
      id,
      name: participant.uma_name || id,
      display_number: Number(participant.entry_number) || index + 1,
      current_lane: currentLane,
      score: Number(latest?.score_after) || 0,
      recordedRank: Number(latest?.position) || Infinity,
      running_style: participant.running_style,
      track_avatar: avatars[id] || "",
      latestTurn: turn,
      roll,
      pack_state: color === "gold" ? "in" : color === "white" ? "out" : null,
    };
  });
  const minScore = Math.min(...players.map((player) => player.score));
  const maxScore = Math.max(...players.map((player) => player.score));
  const spread = maxScore - minScore;

  return [...players]
    .sort((a, b) => b.score - a.score || a.recordedRank - b.recordedRank || a.display_number - b.display_number)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
      distance: player.score,
      // Each turn fills the field from the last runner to the leader.
      progress_ratio: spread > 0 ? 0.06 + ((player.score - minScore) / spread) * 0.88 : 0.5,
      gap_to_leader: maxScore - player.score,
      pack_source: player.pack_state ? "recorded" : "estimated",
      pack_state: player.pack_state || (players.some((other) => other.id !== player.id
        && Math.abs(other.score - player.score) <= 20
        && Math.abs(other.current_lane - player.current_lane) <= 1) ? "in" : "out"),
    }));
}

export function buildReplayTransition(participants, turns, selectedTurn, avatars = {}) {
  const beforeBefore = buildReplayState(participants, turns, Math.max(0, selectedTurn - 2), avatars);
  const before = buildReplayState(participants, turns, Math.max(0, selectedTurn - 1), avatars);
  const after = buildReplayState(participants, turns, selectedTurn, avatars);
  const beforeBeforeById = new Map(beforeBefore.map((player) => [player.id, player]));
  const beforeById = new Map(before.map((player) => [player.id, player]));
  const afterById = new Map(after.map((player) => [player.id, player]));
  const lane = before.map((player) => {
    const previous = beforeBeforeById.get(player.id) || player;
    const selectedTurnPlayer = afterById.get(player.id);
    return {
      ...player,
      // Keep start-of-turn positions, but show the distance color recorded
      // for the selected turn in both replay phases.
      pack_state: selectedTurnPlayer?.pack_state ?? player.pack_state,
      pack_source: selectedTurnPlayer?.pack_source ?? player.pack_source,
      lane_before: previous.current_lane,
      lane_after: player.current_lane,
      lane_changed: previous.current_lane !== player.current_lane,
    };
  });
  const run = after.map((player) => {
    const runStart = beforeById.get(player.id) || player;
    return {
      ...player,
      // A lane change logged in turn N is resolved after turn N and is used
      // for turn N+1. Keep turn N's movement on its actual starting lane.
      current_lane: runStart.current_lane,
      lane_before: runStart.current_lane,
      lane_after: player.current_lane,
      lane_changed: runStart.current_lane !== player.current_lane,
    };
  });
  return {
    start: lane,
    lane,
    run,
  };
}

export function groupReplayEvents(players, actions, selectedTurn) {
  const names = new Map(players.map((player) => [player.id, player.name]));
  const playersById = new Map(players.map((player) => [player.id, player]));
  const events = new Map(players.map((player) => [player.id, []]));
  const currentActions = actions.filter((action) => {
    const turnNumber = Number(action.turn_number);
    const type = String(action.action_type || "").toLowerCase();
    // Lane changes are resolved at the transition into the next turn, so
    // show the recorded change at the start of the turn where it takes effect.
    if (type === "lane_change") return turnNumber === selectedTurn - 1;
    return turnNumber === selectedTurn;
  });
  currentActions.forEach((action, index) => {
    const actor = String(action.participant_id);
    const target = action.target_participant_id == null ? null : String(action.target_participant_id);
    const data = objectData(action.action_data ?? action.action_data_json);
    const actorPlayer = playersById.get(actor);
    const event = {
      id: `action-${action.action_id ?? index}`,
      label: formatReplayAction(action),
      type: String(action.action_type || "").toLowerCase(),
      skillId: data.skill_id,
      skillName: data.skill_name,
      target: target ? names.get(target) || target : "",
      runLane: actorPlayer?.lane_before ?? actorPlayer?.current_lane,
      nextLane: actorPlayer?.lane_after ?? actorPlayer?.current_lane,
      laneChanged: Boolean(actorPlayer?.lane_changed),
      blockedRunnerIds: Array.isArray(data.blocked_runner_ids)
        ? data.blocked_runner_ids.map((value) => String(value))
        : [],
      blockedRunnerNames: Array.isArray(data.blocked_runner_ids)
        ? data.blocked_runner_ids.map((value) => names.get(String(value)) || String(value))
        : [],
    };
    events.get(actor)?.push(event);
    if (target && target !== actor) events.get(target)?.push({
      ...event, id: `${event.id}-received`, incoming: true, actor: names.get(actor) || actor, target: "",
    });
  });
  // Older histories can contain skill snapshots without a matching action row.
  for (const player of players) {
    const playerEvents = events.get(player.id);
    const skills = getReplayTurnData(player.latestTurn).skills || [];
    for (const [index, skill] of skills.entries()) {
      const id = typeof skill === "string" ? skill : skill.id;
      const name = typeof skill === "string" ? skill : skill.name || id;
      if (playerEvents.some((event) => !event.incoming && event.type === "skill"
        && ((id && event.skillId === id) || (name && event.skillName === name)))) continue;
      playerEvents.push({ id: `snapshot-${index}`, label: `ใช้สกิล ${name}`, type: "skill", skillId: id, skillName: name });
    }
  }
  return events;
}
