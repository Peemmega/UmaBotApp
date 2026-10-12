import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";
import "../styles/mailbox.css";

import MailboxModal, { RaceRegistrationMailDialog } from "../components/MailboxModal";
import RenameModal from "../components/RenameModal";
import PageTransition from "../components/PageTransition";
import { AppShell, GameNav, TopBar } from "../components/layout";
import LazyLoadingFallback from "../components/LazyLoadingFallback";
import { BOT_API_BASE, uploadPresetProfileImage } from "../api/playerApi";
import {
  loadActiveProfileType,
  loadProfilePresets,
  saveProfilePresets,
} from "../data/profilePresets";

const ProfilePage = lazy(() => import("./dashboard/ProfilePage"));
const TutorialsPage = lazy(() => import("./dashboard/TutorialsPage"));
const SkillsPage = lazy(() => import("./dashboard/SkillsPage"));
const CharactersPage = lazy(() => import("./dashboard/CharactersPage"));
const QAPage = lazy(() => import("./dashboard/QAPage"));
const RacesPage = lazy(() => import("./dashboard/RacesPage"));
const ToolsPage = lazy(() => import("./dashboard/ToolsPage"));
const RaceReplayPage = lazy(() => import("./dashboard/RaceReplayPage"));
const NewsPage = lazy(() => import("./dashboard/NewsPage"));
const NewsDetailsPage = lazy(() => import("./dashboard/NewsDetailsPage"));
const HomePage = lazy(() => import("./dashboard/HomePage"));
const SystemGuidePage = lazy(() => import("./dashboard/SystemGuidePage"));
import { getSystemTopic } from "../data/systemGuide";
import { getNewsKind } from "../utils/newsItems";

const VALID_PAGES = [
  "home",
  "profile",
  "chars",
  "races",
  "skills",
  "tools",
  "tutorials",
  "qa",
  "race-replay",
  "news",
];

function getNewsRouteFromPath() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length < 4 || segments[0] !== "dashboard" || segments[1] !== "news") return null;
  const kind = segments.at(-1);
  if (!["event", "race", "news", "patch"].includes(kind)) return null;
  try {
    return { name: decodeURIComponent(segments.slice(2, -1).join("/")), kind };
  } catch {
    return null;
  }
}

function getCharacterRouteFromPath() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments.length < 4 || segments[0] !== "dashboard" || segments[1] !== "chars") return null;
  try {
    return { id: decodeURIComponent(segments[2]), type: decodeURIComponent(segments.slice(3).join("/")) };
  } catch {
    return null;
  }
}

function getSystemTopicFromPath() {
  const match = window.location.pathname.match(/^\/dashboard\/system\/([^/]+)\/?$/);
  return match && getSystemTopic(match[1]) ? match[1] : null;
}

function getPageFromPath() {
  if (getSystemTopicFromPath()) return "system-guide";
  if (getNewsRouteFromPath()) return "news-detail";
  if (getCharacterRouteFromPath()) return "chars";
  const normalizedPath = window.location.pathname.replace(/\/+$/, "");
  const page = normalizedPath.split("/").pop();
  return VALID_PAGES.includes(page) ? page : "home";
}

function getInitialPageFromPath() {
  const initialPath = window.location.pathname.replace(/\/+$/, "");
  return initialPath === "/dashboard/profile" ? "home" : getPageFromPath();
}

export default function DashboardPage({
  username,
  userId,
  avatarUrl,
  player,
  setPlayer,
  accountRole,
  error,
  onLogout,
}) {
  const [isEditStatsOpen, setIsEditStatsOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [registrationMail, setRegistrationMail] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isPresetRenameOpen, setIsPresetRenameOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const previousUnreadCount = useRef(null);
  const [activePage, setActivePage] = useState(getInitialPageFromPath);
  const [newsRoute, setNewsRoute] = useState(getNewsRouteFromPath);
  const [characterRoute, setCharacterRoute] = useState(getCharacterRouteFromPath);
  const [systemTopic, setSystemTopic] = useState(getSystemTopicFromPath);
  const [skillLoadoutVersion, setSkillLoadoutVersion] = useState(0);
  const [profiles, setProfiles] = useState(() => loadProfilePresets(userId, username));
  const [activeProfileType, setActiveProfileType] = useState(() => accountRole || loadActiveProfileType(userId));

  useEffect(() => {
    const nextProfiles = loadProfilePresets(userId, player?.username || username);
    setProfiles(nextProfiles);
    setActiveProfileType(accountRole || loadActiveProfileType(userId));
  }, [accountRole, userId, username]);

  useEffect(() => {
    if (!userId) return;
    saveProfilePresets(userId, profiles);
    if (accountRole !== "trainer" && accountRole !== "npc") return;

    const profile = profiles[accountRole];
    const imageUrl = String(profile?.imageUrl || "");
    let cancelled = false;

    async function persistProfilePreset() {
      // Upgrade a legacy Base64 image in localStorage on the next visit. This
      // prevents an older browser cache from writing the large value back.
      if (imageUrl.startsWith("data:image/")) {
        const response = await fetch(imageUrl);
        const imageBlob = await response.blob();
        const migrated = await uploadPresetProfileImage(
          userId,
          accountRole,
          new File([imageBlob], "profile.webp", { type: imageBlob.type || "image/webp" })
        );
        if (!cancelled) {
          setProfiles((current) => ({
            ...current,
            [accountRole]: {
              ...current[accountRole],
              imageUrl: migrated.image_url,
            },
          }));
        }
        return;
      }

      await fetch(`${BOT_API_BASE}/profiles/preset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: String(userId),
          profile_type: accountRole,
          name: profile?.name || accountRole,
          image_url: imageUrl,
        }),
      });
    }

    persistProfilePreset().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [accountRole, profiles, userId]);

  const activeProfile = profiles[activeProfileType] || profiles.trainee;

  const changePage = (page) => {
    if (page.startsWith("system/")) {
      const topicId = page.slice("system/".length);
      if (!getSystemTopic(topicId)) return;
      setNewsRoute(null);
      setCharacterRoute(null);
      setSystemTopic(topicId);
      setActivePage("system-guide");
      window.history.pushState({}, "", `/dashboard/system/${topicId}`);
      window.scrollTo(0, 0);
      return;
    }
    if (!VALID_PAGES.includes(page)) return;

    setSystemTopic(null);
    setNewsRoute(null);
    setCharacterRoute(null);
    setActivePage(page);
    window.history.pushState({}, "", `/dashboard/${page}`);
  };

  const openNewsDetail = (item) => {
    const name = String(item?.name || item?.title || item?.id || "").trim();
    if (!name) return;
    const kind = getNewsKind(item);
    setNewsRoute({ name, kind, item, fromPage: activePage === "news-detail" ? "news" : activePage });
    setActivePage("news-detail");
    window.history.pushState({}, "", `/dashboard/news/${encodeURIComponent(name)}/${kind}`);
  };

  const openCharacterDetail = (character) => {
    const id = String(character?.id || character?.userId || "").trim();
    const type = String(character?.type || "").trim();
    if (!id || !type) return;
    setCharacterRoute({ id, type, character, fromPage: "chars" });
    setActivePage("chars");
    window.history.pushState({}, "", `/dashboard/chars/${encodeURIComponent(id)}/${encodeURIComponent(type)}`);
    window.scrollTo(0, 0);
  };

  const renderMiddlePage = () => {
    switch (activePage) {
      case "system-guide":
        return <SystemGuidePage topicId={systemTopic} onNavigate={changePage} onBack={() => {
          changePage("home");
          window.history.replaceState({}, "", "/dashboard/home#race-system");
        }} />;
      case "home":
        return <HomePage username={player?.username || username} onNavigate={changePage} onOpenNews={openNewsDetail} />;

      case "tutorials":
        return <TutorialsPage />;

      case "skills":
        return (
          <SkillsPage
            userId={userId}
            username={player?.username || username}
            onSkillEquipped={() => {
              setSkillLoadoutVersion((v) => v + 1);
            }}
          />
        );

      case "chars":
        return <CharactersPage
          userId={userId}
          player={player}
          profiles={profiles}
          characterRoute={characterRoute}
          onOpenCharacter={openCharacterDetail}
          onBack={() => {
            setCharacterRoute(null);
            window.history.replaceState({}, "", "/dashboard/chars");
          }}
        />;

      case "races":
        return <RacesPage userId={userId} profileType={activeProfileType} />;

      case "qa":
        return <QAPage />;

      case "tools":
        return <ToolsPage />;

      case "news":
        return <NewsPage onOpenNews={openNewsDetail} />;

      case "news-detail":
        return <NewsDetailsPage
          name={newsRoute?.name}
          kind={newsRoute?.kind}
          initialItem={newsRoute?.item}
          userId={userId}
          profileType={activeProfileType}
          onBack={() => {
            const page = VALID_PAGES.includes(newsRoute?.fromPage) ? newsRoute.fromPage : "news";
            setNewsRoute(null);
            setActivePage(page);
            window.history.replaceState({}, "", `/dashboard/${page}`);
          }}
        />;

      case "race-replay":
        return <RaceReplayPage raceId={new URLSearchParams(window.location.search).get("race")} onBack={() => changePage("races")} />;

      case "profile":
      default:
        return (
          <ProfilePage
            username={username}
            userId={userId}
            avatarUrl={avatarUrl}
            player={player}
            setPlayer={setPlayer}
            profile={activeProfile}
            profileType={activeProfileType}
            onSaveProfile={(changes) => {
              setProfiles((current) => ({
                ...current,
                [activeProfileType]: {
                  ...current[activeProfileType],
                  ...changes,
                },
              }));
            }}
            onRequestRename={() => setIsPresetRenameOpen(true)}
            error={error}
            isEditStatsOpen={isEditStatsOpen}
            setIsEditStatsOpen={setIsEditStatsOpen}
            setIsRenameOpen={setIsRenameOpen}
            skillLoadoutVersion={skillLoadoutVersion}
          />
        );
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await fetch(
        `${BOT_API_BASE}/mailbox/${userId}?profile_type=${activeProfileType}`
      );

      const data = await res.json();
      const unread = data.filter((m) => !m.is_read).length;
      const previous = previousUnreadCount.current;
      setUnreadCount(unread);
      previousUnreadCount.current = unread;
      if (previous !== null && unread > previous && Notification.permission === "granted") {
        const notification = new Notification("UmaDnD — New mail", {
          body: `You have ${unread} unread message${unread === 1 ? "" : "s"}.`,
          icon: "/uma-icon.webp",
        });
        notification.onclick = () => {
          window.focus();
          setIsMailboxOpen(true);
          notification.close();
        };
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const entryPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (entryPath === "/" || entryPath === "/dashboard" || entryPath === "/dashboard/profile") {
      window.history.replaceState(
        {},
        "",
        `/dashboard/home${window.location.search}${window.location.hash}`
      );
    }

    const handlePopState = () => {
      setActivePage(getPageFromPath());
      setNewsRoute(getNewsRouteFromPath());
      setCharacterRoute(getCharacterRouteFromPath());
      setSystemTopic(getSystemTopicFromPath());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    previousUnreadCount.current = null;
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [activeProfileType, userId]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const modals = (
    <>
      {isMailboxOpen && (
        <MailboxModal
          userId={userId}
          profileType={activeProfileType}
          onClose={() => {
            setIsMailboxOpen(false);
            loadUnreadCount();
          }}
          onMailChanged={loadUnreadCount}
          onOpenRegistration={(mail) => {
            setIsMailboxOpen(false);
            setIsEditStatsOpen(false);
            setIsRenameOpen(false);
            setIsPresetRenameOpen(false);
            window.dispatchEvent(new Event("uma:close-overlays"));
            setRegistrationMail(mail);
          }}
        />
      )}

      {registrationMail && (
        <RaceRegistrationMailDialog
          mail={registrationMail}
          userId={userId}
          onClose={() => setRegistrationMail(null)}
          onCompleted={async () => {
            setRegistrationMail(null);
            await loadUnreadCount();
          }}
        />
      )}

      {isRenameOpen && (
        <RenameModal
          userId={userId}
          currentName={player?.username || username}
          onClose={() => setIsRenameOpen(false)}
          onSave={(newName) => {
            setPlayer((prev) => ({
              ...prev,
              username: newName,
            }));
            setIsRenameOpen(false);
          }}
        />
      )}

      {isPresetRenameOpen && (
        <RenameModal
          currentName={activeProfile?.name || ""}
          saveLocally
          onClose={() => setIsPresetRenameOpen(false)}
          onSave={(name) => {
            setProfiles((current) => ({
              ...current,
              [activeProfileType]: { ...current[activeProfileType], name },
            }));
            setIsPresetRenameOpen(false);
          }}
        />
      )}
    </>
  );

  return (
    <AppShell
      profileType={activeProfileType}
      topBar={
        <TopBar
          onHomeClick={() => changePage("home")}
          unreadCount={unreadCount}
          onMailClick={() => setIsMailboxOpen(true)}
          onLogout={onLogout}
          notificationPermission={notificationPermission}
          onEnableNotifications={enableNotifications}
          nav={<GameNav activePage={activePage === "system-guide" ? "home" : activePage === "race-replay" ? "races" : activePage === "news-detail" ? "news" : activePage} onChangePage={changePage} profileType={activeProfileType} />}
        />
      }
      modals={modals}
    >
      <AnimatePresence mode="wait">
        <PageTransition key={activePage === "system-guide" ? `${activePage}/${systemTopic}` : activePage}>
          <Suspense fallback={<LazyLoadingFallback />}>
            {renderMiddlePage()}
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </AppShell>
  );
}
