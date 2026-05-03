import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/mailbox.css";

import { mainStats, aptitudeRows } from "../data/dashboardConfig";
import StatCell from "../components/StatCell";
import AptitudeItem from "../components/AptitudeItem";
import ResourcePill from "../components/ResourcePill";
import EditStatsModal from "../components/EditStatsModal";
import coinIcon from "../assets/icons/umaCoin.webp";
import statIcon from "../assets/icons/statsPoint.webp";
import skillIcon from "../assets/icons/skillPoint.webp";
import bgImage from "../assets/bg/profile-bg.webp";
import MailboxModal from "../components/MailboxModal";
import mailIcon from "../assets/icons/mail_icon.webp";
import discordIcon from "../assets/icons/discord_icon.webp";
import editIcon from "../assets/icons/change_icon.webp";
import RenameModal from "../components/RenameModal";
import ZonePanel from "../components/ZonePanel";
import RaceCalendar from "../components/RaceCalendar";
import TopBar from "../components/TopBar";

import { playSound } from "../utils/soundManager";

import DashboardSidebar from "../components/DashboardSidebar";
import ProfilePage from "./dashboard/ProfilePage";
import TutorialsPage from "./dashboard/TutorialsPage";
import SkillsPage from "./dashboard/SkillsPage";
import CharactersPage from "./dashboard/CharactersPage";
import QAPage from "./dashboard/QAPage";
import RacesPage from "./dashboard/RacesPage";

export default function DashboardPage({
  username,
  userId,
  avatarUrl,
  player,
  setPlayer,
  statsSummary,
  showRaw,
  setShowRaw,
  error,
  loading,
  onLogout,
}) {
  const [isEditStatsOpen, setIsEditStatsOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [activePage, setActivePage] = useState("profile");

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

      case "qa":
        return <QAPage />;
      case "races":
        return <RacesPage />;

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
      const res = await fetch(`https://umadndbot-production.up.railway.app/mailbox/${userId}`);
      const data = await res.json();

      const unread = data.filter((m) => !m.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    }
  };

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
        // backgroundImage: `url(${bgImage})`,
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
          <DashboardSidebar
            activePage={activePage}
            onChangePage={setActivePage}
          />

          <div className="dashboard-shell">
            {renderMiddlePage()}
          </div>

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