import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";

const DISCORD_CLIENT_ID = "YOUR_CLIENT_ID";
const API_BASE = "https://your-api.up.railway.app";

const REDIRECT_URI = "umadnd://callback";

export async function loginWithDiscordApp() {
  const url =
    `https://discord.com/oauth2/authorize` +
    `?client_id=${DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify`;

  await Browser.open({ url });
}

export function setupDiscordDeepLink() {
  App.addListener("appUrlOpen", async (event) => {
    const url = new URL(event.url);

    if (url.protocol === "umadnd:" && url.hostname === "callback") {
      const code = url.searchParams.get("code");

      if (code) {
        await Browser.close();

        const res = await fetch(
          `${API_BASE}/callback/mobile?code=${code}`
        );

        const data = await res.json();

        localStorage.setItem("user", JSON.stringify(data));

        window.location.href =
          `/dashboard?username=${data.username}` +
          `&id=${data.id}` +
          `&avatar=${data.avatar}`;
      }
    }
  });
}