import React from "react";
import { mainStats, aptitudeRows } from "../../data/dashboardConfig";
import StatCell from "../../components/StatCell";
import AptitudeItem from "../../components/AptitudeItem";
import ResourcePill from "../../components/ResourcePill";
import EditStatsModal from "../../components/EditStatsModal";
import ZonePanel from "../../components/ZonePanel";
import coinIcon from "../../assets/icons/umaCoin.png";
import statIcon from "../../assets/icons/statsPoint.png";
import skillIcon from "../../assets/icons/skillPoint.png";
import editIcon from "../../assets/icons/change_icon.png";
import { playSound } from "../../utils/soundManager";

export default function ProfilePage({
  username,
  userId,
  avatarUrl,
  player,
  setPlayer,
  error,
  isEditStatsOpen,
  setIsEditStatsOpen,
  setIsRenameOpen,
}) {
  return (
    <>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="dashboard-shell">
          {error ? <div className="error-box">{error}</div> : null}

          <section className="profile-card">
            <div className="title-banner">
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
              userId={userId}
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
    </>
  );
}