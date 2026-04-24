import React, { useEffect, useMemo, useState } from "react";
import LoginPage from "./pages/LoginPage";
import LoadingPage from "./pages/LoadingPage";
import DashboardPage from "./pages/DashboardPage";
import LoadingScreen from "./components/LoadingScreen";

const APP_BASE = "https://umabotapp-production-c99a.up.railway.app";
const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const username = query.get("username");
  const userId = query.get("id");
  const avatarHash = query.get("avatar");

  const [appReady, setAppReady] = useState(false);
  const [player, setPlayer] = useState(null);
  const [statsSummary, setStatsSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username || !userId) return;
    
    const cacheKey = `player:${userId}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        setPlayer(JSON.parse(cached));
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    const loadPlayer = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${BOT_API_BASE}/player/${userId}`);
        if (!res.ok) throw new Error(`player API failed: ${res.status}`);

        const data = await res.json();
        setPlayer(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error(err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const res = await fetch(`${APP_BASE}/api/bot-stats`);
        if (!res.ok) return;
        const data = await res.json();
        setStatsSummary(data);
      } catch (err) {
        console.error("stats load error:", err);
      }
    };

    loadPlayer();
    loadStats();
  }, [username, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const avatarUrl = useMemo(() => {
    if (!userId || !avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
  }, [userId, avatarHash]);

  if (!appReady) {
    return <LoadingScreen />;
  }

  if (!username) {
    return <LoginPage appBase={APP_BASE} />;
  }

  if (loading && !player) {
    return <LoadingPage />;
  }

  return (
    <DashboardPage
      username={username}
      userId={userId}
      avatarUrl={avatarUrl}
      player={player}
      setPlayer={setPlayer}
      statsSummary={statsSummary}
      showRaw={showRaw}
      setShowRaw={setShowRaw}
      error={error}
    />
  );
}