const DEFAULT_API_BASE = "https://umadndbot-production.up.railway.app";

const apiBase =
  import.meta.env.VITE_TCG_API_BASE ||
  import.meta.env.VITE_BOT_API_BASE ||
  DEFAULT_API_BASE;

export const BOT_API_URL = apiBase.replace(/\/$/, "");
export const TCG_API_BASE = BOT_API_URL;

export function debugApiLog(...args) {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
}
