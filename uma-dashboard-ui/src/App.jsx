import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CardGamePage from "./pages/dashboard/CardGamePage";
import RaceGamePage from "./pages/dashboard/RaceGamePage";
import LoadingScreen from "./components/LoadingScreen";
import HorseshoeBackground from "./components/HorseshoeBackground";
import PageTransition from "./components/PageTransition";
import { getAccountRole, getPlayer, selectAccountRole } from "./api/playerApi";
import { APP_BASE_URL } from "./api/appConfig";
import { getDiscordAvatarUrl, resolveSessionAvatar } from "./utils/avatar";

const APP_BASE = APP_BASE_URL;

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

const ROLE_CHOICES = [
  { id: "trainee", title: "Umamusume", detail: "Create a racing profile with Stats, Skills, and Zone." },
  { id: "trainer", title: "Trainer", detail: "Create a trainer profile to manage an Umamusume team." },
  { id: "npc", title: "NPC", detail: "Create a character profile for roleplay." },
];

function RoleSelection({ busy, error, onSelect }) {
  return (
    <main className="role-selection-page">
      <section className="role-selection-card" aria-labelledby="role-selection-title">
        <span className="role-selection-kicker">Welcome to Tracen Academy</span>
        <h1 id="role-selection-title">Choose your role</h1>
        <p>This choice creates the data for your selected role.</p>
        <div className="role-selection-grid">
          {ROLE_CHOICES.map((role) => (
            <button key={role.id} type="button" onClick={() => onSelect(role.id)} disabled={busy}>
              <strong>{role.title}</strong>
              <span>{role.detail}</span>
            </button>
          ))}
        </div>
        {busy && <p className="role-selection-status">Creating your profile...</p>}
        {error && <p className="role-selection-error">{error}</p>}
      </section>
    </main>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [routePath, setRoutePath] = useState(window.location.pathname);

  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [avatarHash, setAvatarHash] = useState("");

  const [player, setPlayer] = useState(null);
  const [accountRole, setAccountRole] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [statsSummary, setStatsSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleRouteChange = () => {
      setRoutePath(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("uma:navigate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("uma:navigate", handleRouteChange);
    };
  }, []);

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

      window.history.replaceState({}, document.title, "/dashboard/profile");
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

    let cancelled = false;
    setIsRoleLoading(true);
    setRoleError("");
    getAccountRole(userId)
      .then((data) => {
        if (!cancelled) setAccountRole(data.role || null);
      })
      .catch((err) => {
        if (!cancelled) setRoleError(String(err.message || err));
      })
      .finally(() => {
        if (!cancelled) setIsRoleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, username]);

  useEffect(() => {
    if (!username || !userId || accountRole !== "trainee") return;

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

        const data = await getPlayer(userId, username);
        setPlayer(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (err) {
        console.error("PLAYER LOAD ERROR:", err);

        setError(
          `USERNAME: ${username}\n` +
          `USER ID: ${userId}\n\n` +
          `ERROR: ${String(err)}`
        );
      } finally {
        setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const res = await fetch(`${APP_BASE}/api/bot-stats/`);
        if (!res.ok) return;

        const data = await res.json();
        setStatsSummary(data);
      } catch (err) {
        console.error("STATS LOAD ERROR:", err);

        setError(
          `STATS API ERROR\n\n` +
          `URL: ${APP_BASE}/api/bot-stats\n\n` +
          `ERROR: ${String(err)}`
        );
      }
    };

    loadPlayer();
    loadStats();
  }, [accountRole, username, userId]);

  useEffect(() => {
    if (!userId || !player) return;
    sessionStorage.setItem(`player:${userId}`, JSON.stringify(player));
  }, [player, userId]);

  const discordAvatarUrl = useMemo(
    () => getDiscordAvatarUrl(userId, avatarHash),
    [avatarHash, userId]
  );

  const avatarUrl = useMemo(
    () => resolveSessionAvatar({ player, discordAvatarUrl }),
    [discordAvatarUrl, player]
  );

  useEffect(() => {
    if (!userId) return;
    console.info("[avatar] resolved session avatar", {
      userId,
      profile_image_url: player?.profile_image_url || "",
      discord_avatar_url: discordAvatarUrl || "",
      final_img_src: avatarUrl || "",
    });
  }, [avatarUrl, discordAvatarUrl, player?.profile_image_url, userId]);

  const normalizedRoutePath = routePath.replace(/\/+$/, "") || "/";
  const isTcgRoute =
    normalizedRoutePath === "/tcg" ||
    normalizedRoutePath === "/dashboard/tcg" ||
    normalizedRoutePath === "/dashboard/tcg-fullscreen";
  const isRaceRoute =
    normalizedRoutePath === "/race" ||
    normalizedRoutePath === "/dashboard/race" ||
    normalizedRoutePath === "/dashboard/race-fullscreen";

  const handleBackToDashboard = () => {
    window.history.pushState({}, "", "/dashboard/profile");
    window.dispatchEvent(new Event("uma:navigate"));
  };

  const handleRoleSelection = async (role) => {
    try {
      setIsRoleSaving(true);
      setRoleError("");
      const result = await selectAccountRole({ userId, username, role });
      setAccountRole(result.role);
      if (result.player) {
        setPlayer(result.player);
        sessionStorage.setItem(`player:${userId}`, JSON.stringify(result.player));
      }
    } catch (err) {
      setRoleError(String(err.message || err));
    } finally {
      setIsRoleSaving(false);
    }
  };

  const pageContent = !username ? (
    <LoginPage key="login" appBase={APP_BASE} />
  ) : isRoleLoading ? (
    <LoadingScreen key="role-loading" onFinished={() => {}} />
  ) : !accountRole ? (
    <RoleSelection busy={isRoleSaving} error={roleError} onSelect={handleRoleSelection} />
  ) : isTcgRoute && accountRole === "trainee" ? (
    <PageTransition key="tcg">
      <CardGamePage
        fullscreen
        onBackToDashboard={handleBackToDashboard}
        username={player?.username || username}
        userId={userId}
        avatarUrl={avatarUrl}
      />
    </PageTransition>
  ) : isRaceRoute && accountRole === "trainee" ? (
    <PageTransition key="race">
      <RaceGamePage
        fullscreen
        onBackToDashboard={handleBackToDashboard}
        username={player?.username || username}
        userId={userId}
        avatarUrl={avatarUrl}
      />
    </PageTransition>
  ) : (
    <DashboardPage
      key="dashboard"
      username={username}
      userId={userId}
      avatarUrl={avatarUrl}
      player={player}
      setPlayer={setPlayer}
      accountRole={accountRole}
      statsSummary={statsSummary}
      showRaw={showRaw}
      setShowRaw={setShowRaw}
      error={error}
      loading={loading}
    />
  );

  return (
    <>
      {!isTcgRoute && !isRaceRoute && <HorseshoeBackground />}

      <AnimatePresence mode="wait">{pageContent}</AnimatePresence>

      {showIntro && (
        <LoadingScreen onFinished={() => setShowIntro(false)} />
      )}
    </>
  );
}
