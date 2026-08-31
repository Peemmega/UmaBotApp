import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BOT_API_BASE as API_BASE } from "../api/playerApi";
import { getSkillIcon } from "../utils/getSkillIcon";
import { describeRaceEffect } from "../utils/raceEffects";
import staminaIcon from "../assets/icons/Stamina.webp";
import SkillLoadoutPresetModal from "./SkillLoadoutPresetModal";

const STAMINA_EMOJI_PATTERN = /(<a?:Stamina:\d+>)/g;

function renderTextWithIcons(text) {
  if (!text) return null;

  return String(text).split(STAMINA_EMOJI_PATTERN).map((part, index) =>
    /^<a?:Stamina:\d+>$/.test(part) ? (
      <img key={index} src={staminaIcon} alt="Stamina" className="skill-loadout-inline-icon" />
    ) : part
  );
}

export default function SkillLoadoutPanel({ userId, username, player, refreshKey }) {
  const [skills, setSkills] = useState({});
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isPresetOpen, setIsPresetOpen] = useState(false);

  const loadSkills = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`${API_BASE}/player/${userId}/skills`);
      const data = await res.json();
      setSkills(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSkills();
  }, [userId, refreshKey]);

  useEffect(() => {
    if (!selectedSkill) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedSkill(null);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSkill]);

  const slots = ["slot_1", "slot_2", "slot_3", "slot_4"];
  const currentSkillIds = slots.map((slotKey) => skills?.[slotKey]?.id || null);

  return (
    <section className="skill-loadout-card">
      <div className="title-banner">
        <h2>✨ Skill Loadout</h2>
      </div>
      <div className="skill-loadout-list">
        {slots.map((slotKey, index) => {
          const skill = skills?.[slotKey];

          return (
            <button
              type="button"
              className={`skill-loadout-item${skill ? " skill-loadout-item-button" : ""}`}
              key={slotKey}
              onClick={() => skill && setSelectedSkill(skill)}
              disabled={!skill}
            >
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
                    {skill.cost ?? 0}
                    </span>
                </>
                    ) : (
                    <span className="skill-loadout-empty">
                        ยังไม่ได้ติดตั้งสกิล
                    </span>
                )}
            </button>
          );
        })}
      </div>

      <div className="skill-loadout-preset-bar">
        <button type="button" className="skill-loadout-preset-button" onClick={() => setIsPresetOpen(true)}>
          Presets
        </button>
      </div>

      {selectedSkill && createPortal(
        <div className="skill-loadout-detail-backdrop" onMouseDown={() => setSelectedSkill(null)}>
          <section
            className="skill-loadout-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-loadout-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="skill-loadout-detail-close"
              aria-label="Close skill details"
              onClick={() => setSelectedSkill(null)}
            >
              ×
            </button>

            <div className="skill-loadout-detail-heading">
              <div className="skill-icon-box">{getSkillIcon(selectedSkill.icon)}</div>
              <div>
                <span>{selectedSkill.id}</span>
                <h3 id="skill-loadout-detail-title">{selectedSkill.name}</h3>
              </div>
            </div>

            <div className="skill-loadout-detail-meta">
              <span>CD {selectedSkill.cooldown ?? 0}</span>
              <span>Cost {selectedSkill.cost ?? 0}</span>
              {selectedSkill.target ? <span>{renderTextWithIcons(selectedSkill.target)}</span> : null}
            </div>

            {selectedSkill.trigger ? (
              <p><strong>เงื่อนไข:</strong> {renderTextWithIcons(selectedSkill.trigger)}</p>
            ) : null}

            {Array.isArray(selectedSkill.effects) && selectedSkill.effects.length ? (
              <div className="skill-loadout-detail-effects">
                <strong>ผลของสกิล</strong>
                <ul>
                  {selectedSkill.effects.map((effect, index) => (
                    <li key={`${selectedSkill.id}-${index}`}>
                      {renderTextWithIcons(describeRaceEffect(effect))}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>,
        document.body
      )}

      {isPresetOpen && (
        <SkillLoadoutPresetModal
          userId={userId}
          currentSkillIds={currentSkillIds}
          onClose={() => setIsPresetOpen(false)}
          onApplied={() => {
            loadSkills();
          }}
        />
      )}

      {/* <div className="skill-point-box">
        <span className="sp-circle">SP</span>
        <div>
          <div className="sp-label">Event Point</div>
          <div className="sp-value">{player?.skill_point ?? 0}</div>
        </div>
      </div> */}
    </section>
  );
}
