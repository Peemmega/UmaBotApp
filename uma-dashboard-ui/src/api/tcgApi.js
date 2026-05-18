import { preloadCardImages } from "../data/tcgImageCache";

const API_BASE =
  import.meta.env.VITE_TCG_API_BASE ||
  "https://umatcgserver-production.up.railway.app";

export const TCG_API_BASE = API_BASE.replace(/\/$/, "");
const TCG_DATA_CACHE_KEY = "uma.tcg.data.v2";
let tcgDataCache = null;

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

export function getTcgCards() {
  return request("/tcg/cards");
}

export function getTcgDecks() {
  return request("/tcg/decks");
}

export function getTcgTrainers() {
  return request("/tcg/trainers");
}

export async function loadTcgData({ force = false } = {}) {
  if (!force && tcgDataCache) return tcgDataCache;

  try {
    const [cardsResponse, decksResponse, trainersResponse] = await Promise.all([
      getTcgCards(),
      getTcgDecks(),
      getTcgTrainers(),
    ]);
    const version = [
      cardsResponse.version,
      decksResponse.version,
      trainersResponse.version,
    ].join(":");
    const data = {
      version,
      cards: cardsResponse.cards || {},
      decks: decksResponse.decks || [],
      trainers: trainersResponse.trainers || [],
    };

    tcgDataCache = data;
    localStorage.setItem(TCG_DATA_CACHE_KEY, JSON.stringify(data));
    preloadCardImages(data.cards);
    return data;
  } catch (error) {
    if (force) throw error;

    const cached = localStorage.getItem(TCG_DATA_CACHE_KEY);
    if (!cached) throw error;

    try {
      tcgDataCache = JSON.parse(cached);
      preloadCardImages(tcgDataCache.cards);
      return tcgDataCache;
    } catch {
      localStorage.removeItem(TCG_DATA_CACHE_KEY);
      throw error;
    }
  }
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

export function confirmLoadout(roomId, userId, deckId, trainerId) {
  return request(`/tcg/rooms/${roomId}/loadout`, {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      deck_id: deckId,
      trainer_id: trainerId,
    }),
  });
}

export function getSocketUrl(roomId, userId) {
  const wsBase = TCG_API_BASE.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
  return `${wsBase}/ws/tcg/${roomId}?user_id=${encodeURIComponent(userId)}`;
}
