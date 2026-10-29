# Trainer aptitude sync

The dashboard and Discord bot must both be configured with the same long, random `APTITUDE_SYNC_SECRET`. Set `BOT_API_BASE` on the dashboard server to the bot API URL and `FRONTEND_URL` to the web frontend origin. Restart both services after configuring them. The dashboard requires a signed-in Discord session with the Trainer role. The bot stores the ranks in the same player record used by Discord profile cards and race calculations.
