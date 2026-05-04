import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/mailbox.css";

import MailboxModal from "../components/MailboxModal";
import RenameModal from "../components/RenameModal";
import RaceCalendar from "../components/RaceCalendar";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";

import ProfilePage from "./dashboard/ProfilePage";
import TutorialsPage from "./dashboard/TutorialsPage";
import SkillsPage from "./dashboard/SkillsPage";
import CharactersPage from "./dashboard/CharactersPage";
import QAPage from "./dashboard/QAPage";
import RacesPage from "./dashboard/RacesPage";

const VALID_PAGES = [
  "profile",
  "characters",
  "races",
  "skills",
  "tutorials",
  "qa",
];

function getPageFromPath() {
  const page = window.location.pathname.split("/").pop();
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

  const changePage = (page) => {
    if (!VALID_PAGES.includes(page)) return;

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
          />
        );

      case "characters":
        return <CharactersPage />;

      case "races":
        return <RacesPage userId={userId} />;

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
        `https://umadndbot-production.up.railway.app/mailbox/${userId}`
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

  return (
    <div
      className="dashboard-page"
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <TopBar
        unreadCount={unreadCount}
        onMailClick={() => setIsMailboxOpen(true)}
        onLogout={onLogout}
      />

      <div className="dashboard-layout">
        <Sidebar
          activePage={activePage}
          onChangePage={changePage}
        />

        <div className="dashboard-shell">{renderMiddlePage()}</div>

        <RaceCalendar />
      </div>

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
    </div>
  );
}