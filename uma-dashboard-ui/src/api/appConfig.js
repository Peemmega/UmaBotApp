const configuredAppBase = import.meta.env.VITE_APP_BASE_URL || window.location.origin;

export const APP_BASE_URL = configuredAppBase.replace(/\/$/, "");

const explicitAppVariant = String(import.meta.env.VITE_APP_VARIANT || "")
  .trim()
  .toLowerCase();

function getAppHostname() {
  try {
    return new URL(APP_BASE_URL).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export const IS_MAIN_WEB =
  explicitAppVariant === "main" ||
  (explicitAppVariant !== "test" &&
    getAppHostname() === "umaroleplaycommunity.up.railway.app");
