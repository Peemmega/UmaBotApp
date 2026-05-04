import React, { useEffect, useState } from "react";

const API_BASE = "https://umadndbot-production.up.railway.app";
import { getSkillIcon } from "../utils/getSkillIcon";

export default function SkillLoadoutPanel({ userId, username, player, refreshKey }) {
  const [skills, setSkills] = useState({});

  useEffect(() => {
    if (!userId) return;

    const loadSkills = async () => {
      try {
        const res = await fetch(`${API_BASE}/player/${userId}/skills`);
        const data = await res.json();
        setSkills(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadSkills();
  }, [userId, refreshKey]);

  const slots = ["slot_1", "slot_2", "slot_3", "slot_4"];

  return (
    <section className="skill-loadout-card">
      <div className="skill-loadout-header">✨ Skill Loadout</div>

      <div className="skill-loadout-list">
        {slots.map((slotKey, index) => {
          const skill = skills?.[slotKey];

          return (
            <div className="skill-loadout-item" key={slotKey}>
              <span className="skill-loadout-slot">{index + 1}</span>

              {skill ? (
                <>
                    {/* <img
                    src={getSkillIcon(skill.icon)}
                    alt={skill.name}
                    className="skill-loadout-icon"
                    onError={(e) => {
                        e.currentTarget.src = "/assets/skill_icons/default.png";
                    }}
                    /> */}
                    <div className="skill-icon-box">
                      {getSkillIcon(skill.icon)}
                    </div>

                    <span className="skill-loadout-name">
                    {skill.name}
                    </span>

                    <span className="skill-loadout-cd">
                    CD {skill.cooldown ?? 0}
                    </span>
                </>
                    ) : (
                    <span className="skill-loadout-empty">
                        ยังไม่ได้ติดตั้งสกิล
                    </span>
                )}
            </div>
          );
        })}
      </div>

      {/* <div className="skill-point-box">
        <span className="sp-circle">SP</span>
        <div>
          <div className="sp-label">Skill Point</div>
          <div className="sp-value">{player?.skill_point ?? 0}</div>
        </div>
      </div> */}
    </section>
  );
}