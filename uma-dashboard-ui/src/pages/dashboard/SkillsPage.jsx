import React, { useEffect, useMemo, useState } from "react";
import "../../styles/skillsPage.css";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [tags, setTags] = useState([{ value: "all", label: "ทั้งหมด" }]);
  const [activeTag, setActiveTag] = useState("all");
  const [search, setSearch] = useState("");

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

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const q = search.toLowerCase();

      const matchSearch =
        skill.name.toLowerCase().includes(q) ||
        skill.id.toLowerCase().includes(q) ||
        skill.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchTag =
        activeTag === "all" || skill.tags.includes(activeTag);

      return matchSearch && matchTag;
    });
  }, [skills, search, activeTag]);

  return (
    <section className="skills-page">
      <div className="skills-hero">
        <p className="skills-kicker">Tracen Academy</p>
        <h2>Skills</h2>
        <p>รายการสกิลทั้งหมดจาก UmaDnDBot</p>
      </div>

      <div className="skills-toolbar">
        <input
          className="skills-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skill name / id / tag..."
        />

        <div className="skills-filter-row">
          {tags.map((tag) => (
            <button
              key={tag.value}
              type="button"
              className={`skill-filter-btn ${
                activeTag === tag.value ? "active" : ""
              }`}
              onClick={() => setActiveTag(tag.value)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      <div className="skills-count">
        พบ {filteredSkills.length} สกิล
      </div>

      <div className="skills-grid">
        {filteredSkills.map((skill) => (
          <article className="skill-card" key={skill.id}>
            <div className="skill-card-header">
              <div>
                <div className="skill-id">{skill.id}</div>
                <h3>{skill.name}</h3>
              </div>

              <div className={`skill-icon ${skill.icon}`}>
                {getSkillIcon(skill.icon)}
              </div>
            </div>

            <div className="skill-meta">
              <span>⏱️ CD {skill.cooldown}</span>
              <span>🧠 Cost {skill.cost}</span>
              <span>{skill.active_roll ? "Active Roll" : "Instant"}</span>
            </div>

            <div className="skill-section">
              <strong>เป้าหมาย</strong>
              <p>{skill.target}</p>
            </div>

            <div className="skill-section">
              <strong>เงื่อนไข</strong>
              <p>{skill.trigger}</p>
            </div>

            <div className="skill-section">
              <strong>ผล</strong>
              <ul>
                {skill.effects.map((effect, index) => (
                  <li key={index}>{effect}</li>
                ))}
              </ul>
            </div>

            <div className="skill-tags">
              {skill.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import icon_concentration from "../../assets/skill_icon/Concentration.webp";
import icon_acceleration from "../../assets/skill_icon/Acceleration.webp";
import icon_velocity from "../../assets/skill_icon/Velocity.webp";
import icon_recovery from "../../assets/skill_icon/Recovery.webp";
import icon_decrease from "../../assets/skill_icon/DecreaseVelocity.webp";
import icon_reduce_sta from "../../assets/skill_icon/ReduceSTA.webp";
import icon_lookup from "../../assets/skill_icon/LookUp.webp";
import icon_blind from "../../assets/skill_icon/Blind.webp";

function getSkillIcon(icon) {
  const iconMap = {
    Concentration: icon_concentration,
    Acceleration: icon_acceleration,
    Velocity: icon_velocity,
    Recovery: icon_recovery,
    DecreaseVelocity: icon_decrease,
    ReduceSTA: icon_reduce_sta,
    LookUp: icon_lookup,
    Blind: icon_blind,
  };

  const src = iconMap[icon];

  return src ? (
    <img src={src} alt={icon} className="skill-icon-img" />
  ) : (
    <span>✨</span>
  );
}