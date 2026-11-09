import { APP_BASE_URL } from "./appConfig";

async function request(path, options = {}) {
  const response = await fetch(`${APP_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Room booking API failed: ${response.status}`);
  }
  return response.json();
}

export function getRoomBookingOptions() {
  return request("/api/room-bookings/options");
}

export function listRoomBookings(userId) {
  return request(`/api/room-bookings?user_id=${encodeURIComponent(userId || "")}`);
}

export function createRoomBooking(payload) {
  return request("/api/room-bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function joinRoomBooking(bookingId, userId) {
  return request(`/api/room-bookings/${encodeURIComponent(bookingId)}/join`, {
    method: "POST",
    body: JSON.stringify({ user_id: String(userId) }),
  });
}
