const API_BASE =
  import.meta.env.VITE_TCG_API_BASE ||
  "https://umatcgserver-production.up.railway.app";

export const TCG_API_BASE = API_BASE.replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${TCG_API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `TCG API failed: ${res.status}`);
  }

  return res.json();
}

export function listRooms() {
  return request("/tcg/rooms");
}

export function getRoom(roomId, userId) {
  return request(`/tcg/rooms/${roomId}?user_id=${encodeURIComponent(userId)}`);
}

export function createRoom(player) {
  return request("/tcg/rooms/create", {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function joinRoom(roomId, player) {
  return request(`/tcg/rooms/${roomId}/join`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function leaveRoom(roomId, player) {
  return request(`/tcg/rooms/${roomId}/leave`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function startRoom(roomId, player) {
  return request(`/tcg/rooms/${roomId}/start`, {
    method: "POST",
    body: JSON.stringify(player),
  });
}

export function confirmDeck(roomId, userId, deckId) {
  return request(`/tcg/rooms/${roomId}/deck/confirm`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, deck_id: deckId }),
  });
}

export function getSocketUrl(roomId, userId) {
  const wsBase = TCG_API_BASE.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  return `${wsBase}/ws/tcg/${roomId}?user_id=${encodeURIComponent(userId)}`;
}
