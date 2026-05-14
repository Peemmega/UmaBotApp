import { debugApiLog, TCG_API_BASE } from "./config";

export { TCG_API_BASE };

async function request(path, options = {}) {
  const url = `${TCG_API_BASE}${path}`;

  debugApiLog("[TCG API] Request:", {
    url,
    method: options.method || "GET",
    base: TCG_API_BASE,
    body: options.body ? JSON.parse(options.body) : null,
  });

  let res;

  try {
    res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (err) {
    console.error("[TCG API] Network error:", {
      url,
      message: err.message,
      error: err,
    });
    throw err;
  }

  const rawText = await res.text();

  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { raw: rawText };
  }

  debugApiLog("[TCG API] Response:", {
    url,
    status: res.status,
    ok: res.ok,
    data,
  });

  if (!res.ok) {
    console.error("[TCG API] Failed:", {
      url,
      status: res.status,
      statusText: res.statusText,
      data,
    });

    throw new Error(
      data.detail ||
      data.message ||
      data.raw ||
      `TCG API failed: ${res.status}`
    );
  }

  return data;
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
  const wsBase = TCG_API_BASE
    .replace(/^https:/, "wss:")
    .replace(/^http:/, "ws:");

  const url = `${wsBase}/ws/tcg/${roomId}?user_id=${encodeURIComponent(userId)}`;

  debugApiLog("[TCG WS] URL:", url);

  return url;
}
