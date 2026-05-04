import React, { useEffect, useMemo, useState } from "react";
import "../../styles/skillsPage.css";
import Toast from "../../components/Toast";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";
import { playSound } from "../../utils/soundManager";

import witIcon from "../../assets/icons/Wit.webp";
import staminaIcon from "../../assets/icons/Stamina.webp";
import { getSkillIcon } from "../../utils/getSkillIcon";

export default function SkillsPage({ userId, username }) {
  const [skills, setSkills] = useState([]);
  const [tags, setTags] = useState([{ value: "all", label: "ทั้งหมด" }]);
  const [activeTag, setActiveTag] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [toast, setToast] = useState(null);

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

  function formatText(text) {
    if (!text) return "";

    return text
      .replace(/<:Stamina:\d+>/g, "Stamina") 
      .replace(/<:Speed:\d+>/g, "Speed")
      .replace(/<:Power:\d+>/g, "Power");
  }

  function renderTextWithIcons(text) {
    if (!text) return null;

    const parts = text.split(/(<:Stamina:\d+>)/g);

    return parts.map((part, index) => {
      if (part.match(/<:Stamina:\d+>/)) {
        return (
          <img
            key={index}
            src={staminaIcon}
            alt="stamina"
            className="inline-icon"
          />
        );
      }
      return part;
    });
  }

  return (
    <section className="skills-page">
      <div className="sheet-card">
        <div className="title-banner">
          {/* <p className="skills-kicker">Tracen Academy</p> */}
          <h2>รายการ Skills ทั้งหมด</h2>
          {/* <p>รายการสกิลทั้งหมดจาก UmaDnDBot</p> */}
        </div>

        <div className="skills-toolbar">
          <input
            className="search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skill name / id / tag..."
          />

          <div className="skills-filter-row">
            {tags.map((tag) => (
              <button
                key={tag.value}
                type="button"
                className={`filter-btn ${
                  activeTag === tag.value ? "active" : ""
                }`}
                onClick={() => {
                  playSound("click");
                  setActiveTag(tag.value);
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      

      <div className="skills-count">
        พบ {filteredSkills.length} สกิล
      </div>

      <div className="skills-grid">
        {filteredSkills.map((skill) => (
          <article
            className="skill-card"
            key={skill.id}
            onClick={() => {
              playSound("open"); // 🔥 เพิ่ม
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
                      <li key={index}>{renderTextWithIcons(effect)}</li>
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
          </article>
        ))}
      </div>

      {selectedSkill && (
        <div className="skill-equip-backdrop" onClick={() => setSelectedSkill(null)}>
          <div className="skill-equip-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="skill-equip-close"
              onClick={() => {
                playSound("close");
                setSelectedSkill(null);
              }}
            >
              ×
            </button>

            <div className="skill-equip-title">
              <span>{selectedSkill.id}</span>
              <h3>{selectedSkill.name}</h3>
            </div>

            <p className="skill-equip-desc">
              เลือกช่องที่ต้องการติดตั้งสกิลนี้
            </p>

            <div className="skill-equip-buttons">
              {[1, 2, 3, 4].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    playSound("open");
                    equipSkill(slot);
                    onSkillEquipped?.();
                  }}
                >
                  ใส่ในช่อง {slot}
                </button>
              ))}
            </div>
          </div>
        </div>
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