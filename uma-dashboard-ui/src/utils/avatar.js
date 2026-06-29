import { BOT_API_BASE } from "../api/playerApi";

export const DEFAULT_AVATAR_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="28" fill="#f4ead8"/>
      <circle cx="64" cy="48" r="24" fill="#cfb08a"/>
      <path d="M28 108c6-22 24-34 36-34s30 12 36 34" fill="#cfb08a"/>
    </svg>`
  );

export function isUsableImageSrc(value) {
  const text = String(value || "").trim();
  return Boolean(
    text &&
      (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/"))
  );
}

export function toAbsoluteBotUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:")) {
    return text;
  }
  if (text.startsWith("/")) return `${BOT_API_BASE}${text}`;
  return `${BOT_API_BASE}/${text.replace(/^\/+/, "")}`;
}

export function getDiscordAvatarUrl(userId, avatarHash) {
  if (!userId || !avatarHash) return "";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp`;
}

export function resolveSessionAvatar({ player, discordAvatarUrl = "", fallback = DEFAULT_AVATAR_URL }) {
  const resolved = [
    toAbsoluteBotUrl(player?.profile_image_url),
    toAbsoluteBotUrl(discordAvatarUrl),
    fallback,
  ].find(isUsableImageSrc);

  return resolved || fallback;
}

export function resolveRaceAvatar(player, fallback = DEFAULT_AVATAR_URL) {
  const resolved = [
    toAbsoluteBotUrl(player?.profile_image_url),
    toAbsoluteBotUrl(player?.avatar),
    toAbsoluteBotUrl(player?.thumbnail),
    toAbsoluteBotUrl(player?.thumnail),
    fallback,
  ].find(isUsableImageSrc);

  return resolved || fallback;
}
