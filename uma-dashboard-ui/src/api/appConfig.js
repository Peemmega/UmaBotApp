const configuredAppBase = import.meta.env.VITE_APP_BASE_URL || window.location.origin;

export const APP_BASE_URL = configuredAppBase.replace(/\/$/, "");
