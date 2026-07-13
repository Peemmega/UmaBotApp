import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";

const DISCORD_CLIENT_ID = "1493569100566364291";

const REDIRECT_URI =
  "https://umaroleplaycommunity.up.railway.app/callback/mobile";

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
      await Browser.close();

      const username = url.searchParams.get("username");
      const id = url.searchParams.get("id");
      const avatar = url.searchParams.get("avatar") || "";

      window.location.href =
        `/dashboard?username=${username}` +
        `&id=${id}` +
        `&avatar=${avatar}`;
    }
  });
}
