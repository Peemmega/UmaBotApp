import React, { useState } from "react";
import "../styles/dashboard.css";
import { mainStats, aptitudeRows } from "../data/dashboardConfig";
import StatCell from "../components/StatCell";
import AptitudeItem from "../components/AptitudeItem";
import ResourcePill from "../components/ResourcePill";
import EditStatsModal from "../components/EditStatsModal";

import coinIcon from "../assets/icons/umaCoin.png";
import statIcon from "../assets/icons/statsPoint.png";
import skillIcon from "../assets/icons/skillPoint.png";
import bgImage from "../assets/bg/profile-bg.png";

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

    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <div className="dashboard-eyebrow">Player Dashboard</div>
            <h1 className="dashboard-title">Uma musume RP</h1>
          </div>

          <div className="dashboard-actions">
            <button
              className="ghost-btn"
              onClick={() => setIsEditStatsOpen(true)}
            >
              อัปเดต Stats
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="danger-btn"
            >
              Logout
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
              <div className="profile-name">{player?.username || username}</div>
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

        <section className="sheet-card">
          <div className="section-title">Main Stats</div>
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
        </section>

        <section className="sheet-card">
          <div className="section-title">Aptitude / Attitude</div>
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

        <section className="sheet-card">
          <div className="section-title">Zone</div>
          <div className="zone-grid">
            <div className="zone-info-box">
              <div className="zone-label">Zone Name</div>
              <div className="zone-value">{player?.zone?.name || "Default Zone"}</div>
            </div>
            <div className="zone-info-box">
              <div className="zone-label">Zone Points</div>
              <div className="zone-value">{player?.zone?.points ?? 0}</div>
            </div>
            <div className="zone-info-box">
              <div className="zone-label">Players</div>
              <div className="zone-value">{statsSummary?.total_players ?? "-"}</div>
            </div>
          </div>
        </section>
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
    </div>
    </div>
  );
}