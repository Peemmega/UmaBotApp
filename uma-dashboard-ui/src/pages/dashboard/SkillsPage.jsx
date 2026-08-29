import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/skillsPage.css";
import Toast from "../../components/Toast";
import { BOT_API_BASE } from "../../api/playerApi";

import { playSound } from "../../utils/soundManager";

import witIcon from "../../assets/icons/Wit.webp";
import staminaIcon from "../../assets/icons/Stamina.webp";
import { getSkillIcon } from "../../utils/getSkillIcon";
import { describeRaceEffect } from "../../utils/raceEffects";
import { Badge, Button, GameCard, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";

const STAMINA_EMOJI_PATTERN = /(<a?:Stamina:\d+>)/g;

function renderTextWithIcons(text) {
  if (!text) return null;

  return String(text).split(STAMINA_EMOJI_PATTERN).map((part, index) => {
    if (/^<a?:Stamina:\d+>$/.test(part)) {
      return (
        <img
          key={index}
          src={staminaIcon}
          alt="Stamina"
          className="inline-icon"
        />
      );
    }

    return part;
  });
}

export default function SkillsPage({ userId, username, onSkillEquipped }) {
  const [skills, setSkills] = useState([]);
  const [tags, setTags] = useState([{ value: "all", label: "ทั้งหมด" }]);
  const [activeTag, setActiveTag] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [toast, setToast] = useState(null);
  const [equippedSkills, setEquippedSkills] = useState({});

  const loadEquippedSkills = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BOT_API_BASE}/player/${userId}/skills`);
      if (res.ok) setEquippedSkills(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    fetch(`${BOT_API_BASE}/skills/tags`)
      .then((res) => res.json())
      .then((data) => setTags(data))
      .catch(console.error);

    fetch(`${BOT_API_BASE}/skills?tag=all`)
      .then((res) => res.json())
      .then((data) => setSkills(data))
      .catch(console.error);
    loadEquippedSkills();
  }, []);

    const equipSkill = async (slot) => {
      if (!selectedSkill) return;

      try {
        const res = await fetch(`${BOT_API_BASE}/player/skill/equip`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: String(userId),
            username: username || "Unknown",
            slot,
            skill_id: selectedSkill.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast(data.detail || "ติดตั้งสกิลไม่สำเร็จ", "error");
          return;
        }

        showToast(data.message || "ติดตั้งสกิลสำเร็จ", "success");
        playSound("open");

        await loadEquippedSkills();
        onSkillEquipped?.();

        setSelectedSkill(null);
      } catch (err) {
        console.error(err);
        showToast("เชื่อมต่อ server ไม่ได้", "error");
      }
    };

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const q = search.toLowerCase();

      const matchSearch =
        skill.name.toLowerCase().includes(q) ||
        skill.id.toLowerCase().includes(q) ||
        skill.tags?.some((tag) => tag.toLowerCase().includes(q))

      const matchTag =
        activeTag === "all" || skill.tags?.includes(activeTag);

      return matchSearch && matchTag;
    });
  }, [skills, search, activeTag]);

  const skillDetailsById = useMemo(
    () => new Map(skills.map((skill) => [String(skill.id), skill])),
    [skills]
  );

  return (
    <section className="skills-page">
      <GameCard className="page-control-card skills-page-card">
        <SectionHeader
          title="รายการ Skills ทั้งหมด"
          kicker="Skill Library"
          action={<Badge>{filteredSkills.length} สกิล</Badge>}
        />

        <div className="skills-toolbar">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skill name / id / tag..."
          />

          <label className="skill-filter-select">
            <span>Skill category</span>
            <select
              value={activeTag}
              onChange={(event) => {
                playSound("click");
                setActiveTag(event.target.value);
              }}
            >
              {tags.map((tag) => (
                <option key={tag.value} value={tag.value}>{tag.label}</option>
              ))}
            </select>
          </label>
        </div>
      </GameCard>
      

      {filteredSkills.length === 0 ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>No skills found</strong>
              <span>Try a different keyword or tag.</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : (
        <StaggerContainer className="skills-grid" key={`${activeTag}-${search}`}>
          {filteredSkills.map((skill) => (
          <StaggerItem
            as="article"
            className="ui-game-card skill-card"
            key={skill.id}
            onClick={() => {
              playSound("open");
              setSelectedSkill(skill);
            }}
          >
            <div className="skill-top-row">
              <div className="skill-icon-box">
                {getSkillIcon(skill.icon)}
              </div>
              <div className="skill-id">{skill.id}</div>
              <h3>{skill.name}</h3>
            </div>

            <div className="skill-main-row">
              <div className="skill-content">
                <div className="content-meta-row">
                  <span>CD&nbsp; {skill.cooldown}</span>
                  <span className="skill-cost">
                    <img src={witIcon} alt="cost" />
                    {skill.cost}
                  </span>
                  <span>{skill.target}</span>
                </div>

                <div className="skill-trigger">
                  <strong>เงื่อนไข:</strong> {skill.trigger}
                </div>

                <div className="skill-effects">
                  <strong>ผลของสกิล</strong>
                  <ul>
                    {skill.effects.map((effect, index) => (
                      <li key={index}>{renderTextWithIcons(describeRaceEffect(effect))}</li>
                    ))}
                  </ul>
                </div>

                {/* <div className="skill-tags">
                  {skill.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div> */}
              </div>
            </div>
          </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {selectedSkill && createPortal(
        <div className="skill-equip-backdrop" onClick={() => setSelectedSkill(null)}>
          <div className="skill-equip-modal" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="danger"
              size="sm"
              className="skill-equip-close"
              onClick={() => {
                playSound("close");
                setSelectedSkill(null);
              }}
            >
              ×
            </Button>

            <div className="skill-equip-title">
              <span>{selectedSkill.id}</span>
              <h3>{selectedSkill.name}</h3>
            </div>

            <p className="skill-equip-desc">
              เลือกช่องที่ต้องการติดตั้งสกิลนี้
            </p>

            <SkillDetail skill={selectedSkill} className="skill-equip-selected-detail" />

            <div className="skill-equip-buttons">
              {[1, 2, 3, 4].map((slot) => {
                const currentSkill = equippedSkills[`slot_${slot}`];
                const currentSkillDetails = currentSkill
                  ? skillDetailsById.get(String(currentSkill.id)) || currentSkill
                  : null;
                return (
                <div className="skill-equip-slot-option" key={slot}>
                  <div className="skill-equip-slot-summary">
                    <strong>Slot {slot}</strong>
                    <div className="skill-equip-slot-skill">
                      {currentSkill ? <div className="skill-icon-box">{getSkillIcon(currentSkill.icon)}</div> : null}
                      <span>{currentSkill ? currentSkill.name : "Empty slot"}</span>
                    </div>
                  </div>
                  {currentSkillDetails && <SkillDetail skill={currentSkillDetails} className="skill-equip-current-detail" />}
                <Button
                  type="button"
                  className="skill-equip-slot-button"
                  onClick={() => {
                    playSound("open");
                    equipSkill(slot);
                  }}
                >
                  ใส่ในช่อง {slot}
                </Button>
                </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && (
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
              />
            )}
            
    </section>
  );
}

function SkillDetail({ skill, className = "" }) {
  const effects = Array.isArray(skill?.effects) ? skill.effects : [];
  const description = skill?.description || skill?.effect_text;
  if (!skill) return null;

  return (
    <div className={`skill-detail-summary ${className}`}>
      {description ? <p>{renderTextWithIcons(description)}</p> : null}
      {skill.trigger ? <span><b>Condition:</b> {renderTextWithIcons(skill.trigger)}</span> : null}
      {effects.length ? <ul>{effects.map((effect, index) => <li key={`${skill.id || skill.name}-${index}`}>{renderTextWithIcons(describeRaceEffect(effect))}</li>)}</ul> : null}
    </div>
  );
}
