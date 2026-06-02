const API_BASE =
  import.meta.env.VITE_RACE_API_BASE ||
  import.meta.env.VITE_BOT_API_BASE ||
  "https://umadndbot-production.up.railway.app";

export const RACE_API_BASE = API_BASE.replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${RACE_API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Race API failed: ${res.status}`);
  }

  return res.json();
}

export function listRaceStages() {
  return request("/races");
}

export function listRaceRooms() {
  return request("/race/rooms");
}

export function getRaceRoom(roomId, userId) {
  return request(`/race/rooms/${roomId}?user_id=${encodeURIComponent(userId)}`);
}

export function createRaceRoom(player, stageKey) {
  return request("/race/rooms/create", {
    method: "POST",
    body: JSON.stringify({ ...player, stage_key: stageKey }),
  });
}

export function joinRaceRoom(roomId, player) {
  return request(`/race/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function leaveRaceRoom(roomId, player) {
  return request(`/race/rooms/${roomId}/leave`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function addRaceBot(roomId, player, mobPreset = "rookie_pace", level = 1) {
  return request(`/race/rooms/${roomId}/bot`, {
    method: "POST",
    body: JSON.stringify({ ...player, mob_preset: mobPreset, level }),
  });
}

export function startRaceRoom(roomId, player) {
  return request(`/race/rooms/${roomId}/start`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function runRaceTurn(roomId, player) {
  return request(`/race/rooms/${roomId}/run`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function submitRaceTiming(roomId, timing) {
  const cycleId = Number(timing?.cycle_id);
  const timingScore = Number(timing?.timing_score);
  const timingOffset = Number(timing?.timing_offset ?? 0);
  if (!timing?.user_id || !Number.isInteger(cycleId) || cycleId < 1) {
    return Promise.reject(new Error("Invalid race timing cycle"));
  }
  if (!Number.isFinite(timingScore) || !Number.isFinite(timingOffset)) {
    return Promise.reject(new Error("Invalid race timing score"));
  }

  const numericPhase = Number(timing?.phase);
  const payload = {
    user_id: String(timing.user_id),
    cycle_id: cycleId,
    timing_score: timingScore,
    timing_offset: timingOffset,
  };
  if (timing?.phase !== undefined && timing?.phase !== null && timing.phase !== "") {
    payload.phase = Number.isFinite(numericPhase) ? `phase_${numericPhase}` : String(timing.phase);
  }
  if (timing?.running_style) {
    payload.running_style = String(timing.running_style).toLowerCase();
  }

  return fetch(`${RACE_API_BASE}/race/rooms/${roomId}/timing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error("[Race timing failed]", res.status, errorBody, payload);
      throw new Error(errorBody.detail || `Race API failed: ${res.status}`);
    }
    return res.json();
  });
}

export function confirmRaceTurn(roomId, player) {
  return request(`/race/rooms/${roomId}/confirm`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function rerollRaceTurn(roomId, player) {
  return request(`/race/rooms/${roomId}/reroll`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function witRerollRaceTurn(roomId, player) {
  return request(`/race/rooms/${roomId}/wit-reroll`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function useRaceSkill(roomId, userId, slot, skillId) {
  return request(`/race/rooms/${roomId}/skill`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, slot, skill_id: skillId }),
  });
}

export function useRaceZone(roomId, player) {
  return request(`/race/rooms/${roomId}/zone`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function useRaceBlock(roomId, player) {
  return request(`/race/rooms/${roomId}/block`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function useRaceRush(roomId, player) {
  return request(`/race/rooms/${roomId}/rush`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function getRaceSocketUrl(roomId, userId) {
  const wsBase = RACE_API_BASE.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  return `${wsBase}/ws/race/${roomId}?user_id=${encodeURIComponent(userId)}`;
}
