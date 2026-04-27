import React, { useEffect, useMemo, useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LoadingScreen from "./components/LoadingScreen";
import HorseshoeBackground from "./components/HorseshoeBackground";

const APP_BASE = "https://umabotapp-production-c99a.up.railway.app";
const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const SESSION_KEY = "uma_login";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function saveLoginSession({ username, userId, avatarHash }) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      username,
      userId,
      avatarHash,
      loggedInAt: Date.now(),
    })
  );
}

function loadLoginSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    if (!session.username || !session.userId) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    if (Date.now() - session.loggedInAt > SESSION_MAX_AGE) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [avatarHash, setAvatarHash] = useState("");

  const [player, setPlayer] = useState(null);
  const [statsSummary, setStatsSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    const queryUsername = query.get("username");
    const queryUserId = query.get("id");
    const queryAvatarHash = query.get("avatar");

    if (queryUsername && queryUserId) {
      setUsername(queryUsername);
      setUserId(queryUserId);
      setAvatarHash(queryAvatarHash || "");

      saveLoginSession({
        username: queryUsername,
        userId: queryUserId,
        avatarHash: queryAvatarHash || "",
      });

      window.history.replaceState({}, document.title, "/dashboard");
      return;
    }

    const session = loadLoginSession();

    if (session) {
      setUsername(session.username);
      setUserId(session.userId);
      setAvatarHash(session.avatarHash || "");
    }
  }, []);

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

        const playerUrl = `${BOT_API_BASE}/player/${userId}?username=${encodeURIComponent(
          username
        )}`;

        const res = await fetch(playerUrl);
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

  const avatarUrl = useMemo(() => {
    if (!userId || !avatarHash) return null;
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp`;
  }, [userId, avatarHash]);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(`player:${userId}`);

    setUsername("");
    setUserId("");
    setAvatarHash("");
    setPlayer(null);

    window.location.href = "/";
  };

  if (showIntro) {
    return (
      <>
        <HorseshoeBackground />
        <LoadingScreen onFinished={() => setShowIntro(false)} />
      </>
    );
  }

  return (
    <>
      <HorseshoeBackground />

      {!username ? (
        <LoginPage appBase={APP_BASE} />
      ) : (
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
          loading={loading}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}