import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/mailbox.css";

import { mainStats, aptitudeRows } from "../data/dashboardConfig";
import StatCell from "../components/StatCell";
import AptitudeItem from "../components/AptitudeItem";
import ResourcePill from "../components/ResourcePill";
import EditStatsModal from "../components/EditStatsModal";
import coinIcon from "../assets/icons/umaCoin.png";
import statIcon from "../assets/icons/statsPoint.png";
import skillIcon from "../assets/icons/skillPoint.png";
import bgImage from "../assets/bg/profile-bg.png";
import MailboxModal from "../components/MailboxModal";
import mailIcon from "../assets/icons/mail_icon.png";
import discordIcon from "../assets/icons/discord_icon.png";
import editIcon from "../assets/icons/change_icon.png";
import RenameModal from "../components/RenameModal";
import ZonePanel from "../components/ZonePanel";

import { playSound } from "../utils/soundManager";

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
}) {
  const [isEditStatsOpen, setIsEditStatsOpen] = useState(false);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

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
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
    }}
    >
      <div className="dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <h1 className="dashboard-title">Tracen Academy RP</h1>
          </div>

          <div className="dashboard-actions">
            <a
              className="discord-btn"
              href="https://discord.gg/75R2E9PU"
              target="_blank"
              rel="noreferrer"
              onClick={() => playSound("click")}
            >
              <img src={discordIcon} className="discord-btn-icon" />
              เข้า Discord
            </a>

            <button
              className="mail-btn"
              onClick={() => {
                playSound("open");
                setIsMailboxOpen(true);
              }}
            >
              <img src={mailIcon} className="mail-icon" />
              จดหมาย

              {unreadCount > 0 && (
                <span className="mail-badge">{unreadCount}</span>
              )}
            </button>

            <button
              onClick={() => {
                playSound("close");
                (window.location.href = "/")
              }}
              className="danger-btn"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {error ? <div className="error-box">{error}</div> : null}

        <section className="profile-card">
          <div className="profile-banner">
            <h2>Profile</h2>
          </div>

          <div className="profile-body">
            <div className="profile-avatar-wrap">
              {avatarUrl ? (
                <img src={avatarUrl} alt="profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar placeholder">👤</div>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-name-row">
                <div className="profile-name">{player?.username || username}</div>

                <button
                  className="rename-btn"
                  onClick={() => {
                    playSound("open");
                    setIsRenameOpen(true);
                  }}
                >
                  <img src={editIcon} alt="edit" />
                </button>
              </div>

              <div className="profile-id">Discord ID: {userId}</div>

              <div className="profile-resources">
                <ResourcePill
                  icon={coinIcon}
                  label="Uma Coins"
                  value={player?.uma_coin ?? 0}
                />
                <ResourcePill
                  icon={statIcon}
                  label="Stats Points"
                  value={player?.stats_point ?? 0}
                />
                <ResourcePill
                  icon={skillIcon}
                  label="Skill Points"
                  value={player?.skill_point ?? 0}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="sheet-card main-stats-card">
          <div className="section-header-row">
            <div></div>

            <div className="main-stats-header">
              <div className="section-title">ค่า stats พื้นฐาน</div>

              <button
                className={`update-stats-btn ${isEditStatsOpen ? "active" : ""}`}
                onClick={() => {
                  if (isEditStatsOpen) {
                    playSound("close");

                  } else {
                    playSound("open");
                  }
                  setIsEditStatsOpen((prev) => !prev);
                }}
              >
                {isEditStatsOpen ? "ปิดอัปเดต Stats" : "อัปเดต Stats"}
              </button>
            </div>
          </div>

          <div className="stats-grid">
            {mainStats.map((item) => (
              <StatCell
                key={item.key}
                statKey={item.key}
                label={item.label}
                value={player?.[item.key]}
              />
            ))}
          </div>

          {isEditStatsOpen && (
            <EditStatsModal
              userId={userId}
              player={player}
              onClose={() => setIsEditStatsOpen(false)}
              onSaved={(updated) => {
                setPlayer((prev) => ({
                  ...prev,
                  ...updated,
                }));
                setIsEditStatsOpen(false);
              }}
            />
          )}
        </section>

        <section className="sheet-card">
          <div className="main-stats-header">
            <div className="section-title">ค่าความถนัด</div>
          </div>
          <div className="aptitude-table">
            {aptitudeRows.map((row) => (
              <div className="aptitude-row" key={row.title}>
                <div className="aptitude-row-title">{row.title}</div>
                <div className="aptitude-row-items">
                  {row.items.map((item) => (
                    <AptitudeItem
                      key={item.key}
                      label={item.label}
                      value={player?.[item.key]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

                <ZonePanel
          player={player}
          onSaved={(updatedZone) => {
            setPlayer((prev) => ({
              ...prev,
              zone: {
                ...(prev?.zone || {}),
                ...updatedZone,
              },
            }));
          }}
        />
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