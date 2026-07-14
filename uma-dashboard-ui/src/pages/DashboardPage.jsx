import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";
import "../styles/mailbox.css";

import MailboxModal from "../components/MailboxModal";
import RenameModal from "../components/RenameModal";
import PageTransition from "../components/PageTransition";
import { AppShell, GameNav, RightRail, TopBar } from "../components/layout";
import { BOT_API_BASE } from "../api/playerApi";
import {
  PROFILE_TYPES,
  loadActiveProfileType,
  loadProfilePresets,
  saveProfilePresets,
} from "../data/profilePresets";

import ProfilePage from "./dashboard/ProfilePage";
import TutorialsPage from "./dashboard/TutorialsPage";
import SkillsPage from "./dashboard/SkillsPage";
import CharactersPage from "./dashboard/CharactersPage";
import QAPage from "./dashboard/QAPage";
import RacesPage from "./dashboard/RacesPage";
import CardGamePage from "./dashboard/CardGamePage";
import RaceGamePage from "./dashboard/RaceGamePage";

const VALID_PAGES = [
  "profile",
  "chars",
  "races",
  "race",
  "tcg",
  "skills",
  "tutorials",
  "qa",
];

function getPageFromPath() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "");
  const page = normalizedPath.split("/").pop();
  return VALID_PAGES.includes(page) ? page : "profile";
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isPresetRenameOpen, setIsPresetRenameOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const previousUnreadCount = useRef(null);
  const [activePage, setActivePage] = useState(getPageFromPath);
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
    fetch(`${BOT_API_BASE}/profiles/preset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: String(userId),
        profile_type: accountRole,
        name: profile?.name || accountRole,
        image_url: profile?.imageUrl || "",
      }),
    }).catch(console.error);
  }, [accountRole, profiles, userId]);

  const activeProfile = profiles[activeProfileType] || profiles.trainee;

  const changePage = (page) => {
    if (!VALID_PAGES.includes(page)) return;

    if (page === "tcg") {
      window.history.pushState({}, "", "/tcg");
      window.dispatchEvent(new Event("uma:navigate"));
      return;
    }

    if (page === "race") {
      window.history.pushState({}, "", "/race");
      window.dispatchEvent(new Event("uma:navigate"));
      return;
    }

    setActivePage(page);
    window.history.pushState({}, "", `/dashboard/${page}`);
  };

  const renderMiddlePage = () => {
    switch (activePage) {
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
        return <CharactersPage userId={userId} player={player} profiles={profiles} />;

      case "races":
        return <RacesPage userId={userId} />;

      case "race":
        return (
          <RaceGamePage
            username={player?.username || username}
            userId={userId}
            avatarUrl={avatarUrl}
          />
        );

      case "tcg":
        return <CardGamePage />;

      case "qa":
        return <QAPage />;

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
    const handlePopState = () => {
      setActivePage(getPageFromPath());
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
    }, 5000);

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
          unreadCount={unreadCount}
          onMailClick={() => setIsMailboxOpen(true)}
          onLogout={onLogout}
          profileDesk={PROFILE_TYPES[activeProfileType]?.desk}
          notificationPermission={notificationPermission}
          onEnableNotifications={enableNotifications}
        />
      }
      nav={<GameNav activePage={activePage} onChangePage={changePage} profileType={activeProfileType} />}
      rightRail={
        activeProfileType === "trainee" ? (
          <RightRail
            userId={userId}
            username={player?.username || username}
            player={player}
            skillLoadoutVersion={skillLoadoutVersion}
          />
        ) : null
      }
      modals={modals}
    >
      <AnimatePresence mode="wait">
        <PageTransition key={activePage}>{renderMiddlePage()}</PageTransition>
      </AnimatePresence>
    </AppShell>
  );
}
