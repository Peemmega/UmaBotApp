const API_BASE =
  import.meta.env.VITE_BOT_API_BASE ||
  import.meta.env.VITE_RACE_API_BASE ||
  "https://umadndbot-production.up.railway.app";

export const BOT_API_BASE = API_BASE.replace(/\/$/, "");

async function request(path, options = {}) {
  const res = await fetch(`${BOT_API_BASE}${path}`, options);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || `Player API failed: ${res.status}`);
  }
  return res.json();
}

export function getPlayer(userId, username = "Unknown") {
  return request(`/player/${encodeURIComponent(userId)}?username=${encodeURIComponent(username)}`);
}

export function getAccountRole(userId) {
  return request(`/account/${encodeURIComponent(userId)}/role`);
}

export function selectAccountRole({ userId, username, role }) {
  return request("/account/role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: String(userId), username, role }),
  });
}

export async function uploadProfileImage(userId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return request(`/player/${encodeURIComponent(userId)}/profile-image`, {
    method: "POST",
    body: formData,
  });
}
