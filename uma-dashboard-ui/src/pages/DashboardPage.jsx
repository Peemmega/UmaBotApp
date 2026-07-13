import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "../styles/dashboard.css";
import "../styles/mailbox.css";

import MailboxModal from "../components/MailboxModal";
import RenameModal from "../components/RenameModal";
import PageTransition from "../components/PageTransition";
import { AppShell, GameNav, RightRail, TopBar } from "../components/layout";
import { BOT_API_BASE } from "../api/playerApi";
import ProfileSwitcher from "../components/ProfileSwitcher";
import {
  PROFILE_TYPES,
  loadActiveProfileType,
  loadProfilePresets,
  saveActiveProfileType,
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
  error,
  onLogout,
}) {
  const [isEditStatsOpen, setIsEditStatsOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [activePage, setActivePage] = useState(getPageFromPath);
  const [skillLoadoutVersion, setSkillLoadoutVersion] = useState(0);
  const [profiles, setProfiles] = useState(() => loadProfilePresets(userId, username));
  const [activeProfileType, setActiveProfileType] = useState(() => loadActiveProfileType(userId));

  useEffect(() => {
    const nextProfiles = loadProfilePresets(userId, player?.username || username);
    setProfiles(nextProfiles);
    setActiveProfileType(loadActiveProfileType(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    saveProfilePresets(userId, profiles);
  }, [profiles, userId]);

  const activeProfile = profiles[activeProfileType] || profiles.trainee;

  const selectProfile = (type) => {
    if (!PROFILE_TYPES[type]) return;
    setActiveProfileType(type);
    saveActiveProfileType(userId, type);
    setIsEditStatsOpen(false);
    changePage("profile");
  };

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
        `${BOT_API_BASE}/mailbox/${userId}`
      );

      const data = await res.json();
      const unread = data.filter((m) => !m.is_read).length;
      setUnreadCount(unread);
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

    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const modals = (
    <>
      {isMailboxOpen && (
        <MailboxModal
          userId={userId}
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
          profileType={activeProfileType}
          profileDesk={PROFILE_TYPES[activeProfileType]?.desk}
          profileSwitcher={
            <ProfileSwitcher
              activeType={activeProfileType}
              profiles={profiles}
              onSelect={selectProfile}
            />
          }
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
