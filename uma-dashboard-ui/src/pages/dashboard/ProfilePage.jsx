import React, { useEffect, useState } from "react";
import { mainStats, aptitudeRows } from "../../data/dashboardConfig";
import StatCell from "../../components/StatCell";
import AptitudeItem from "../../components/AptitudeItem";
import ResourcePill from "../../components/ResourcePill";
import EditStatsModal from "../../components/EditStatsModal";
import ZonePanel from "../../components/ZonePanel";
import coinIcon from "../../assets/icons/umaCoin.webp";
import statIcon from "../../assets/icons/statsPoint.webp";
import skillIcon from "../../assets/icons/skillPoint.webp";
import editIcon from "../../assets/icons/change_icon.webp";
import { playSound } from "../../utils/soundManager";
import { getSkillIcon } from "../../utils/getSkillIcon";

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

  const [equippedSkills, setEquippedSkills] = useState({});
  useEffect(() => {
    if (!userId) return;

    fetch(`https://umadndbot-production.up.railway.app/player/${userId}/skills`)
      .then((res) => res.json())
      .then((data) => setEquippedSkills(data))
      .catch(console.error);
  }, [userId]);

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

          <section className="sheet-card main-stats-card padding_container">
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

          <section className="sheet-card padding_container">
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

          <section className="sheet-card padding_container">
            <div className="main-stats-header">
              <div className="section-title">Equipped Skills</div>
            </div>

            <div className="profile-skill-slots">
              {[1, 2, 3, 4].map((slot) => {
                const skill = equippedSkills[`slot_${slot}`];

                return (
                  <div className="profile-skill-slot" key={slot}>
                    <div className="profile-skill-slot-title">Slot {slot}</div>

                    {!skill ? (
                      <div className="profile-skill-empty">ว่าง</div>
                    ) : (
                      <div className="profile-skill-content">
                        <div className="profile-skill-icon-box">
                          {getSkillIcon(skill.icon)}
                        </div>

                        <div className="profile-skill-info">
                          <div className="profile-skill-name">
                            {skill.id} - {skill.name}
                          </div>

                          <div className="profile-skill-meta">
                            <span>CD {skill.cooldown}</span>
                            <span>Cost {skill.cost}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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