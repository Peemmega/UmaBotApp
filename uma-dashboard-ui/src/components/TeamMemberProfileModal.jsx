import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { mainStats, aptitudeRows } from "../data/dashboardConfig";
import { toAbsoluteBotUrl } from "../utils/avatar";
import { getSkillIcon } from "../utils/getSkillIcon";
import { describeRaceEffect } from "../utils/raceEffects";
import staminaIcon from "../assets/icons/Stamina.webp";
import StatCell from "./StatCell";
import AptitudeItem from "./AptitudeItem";

const skillSlots = ["slot_1", "slot_2", "slot_3", "slot_4"];
const STAMINA_EMOJI_PATTERN = /(<a?:Stamina:\d+>)/g;

function renderTextWithIcons(text) {
  if (!text) return null;
  return String(text).split(STAMINA_EMOJI_PATTERN).map((part, index) => (
    /^<a?:Stamina:\d+>$/.test(part)
      ? <img key={index} src={staminaIcon} alt="Stamina" className="skill-loadout-inline-icon" />
      : part
  ));
}

function formatFans(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("th-TH-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function raceName(record) {
  return record?.race_name || record?.stage_name || record?.race?.name || record?.name || record?.track_name || "Unknown race";
}

function racePlacement(record) {
  const place = record?.final_rank ?? record?.placement ?? record?.rank ?? record?.position ?? record?.place;
  return Number.isFinite(Number(place)) ? `#${place}` : "-";
}

function zoneEffects(build = {}) {
  const values = {
    flat: (build.flat ?? 0) * 20,
    add_dkh: build.add_dkh ?? 0,
    cap_floor: ((build.cap_floor ?? 0) + (build.floor ?? 0) + (build.cap ?? 0)) * 3,
    self_heal_stamina: build.self_heal_stamina ?? 0,
    modify_current_speed: build.modify_current_speed ?? 0,
    race_speed: build.race_speed ?? 0,
  };
  const effects = [];
  if (values.flat) effects.push(`เพิ่มผลรวม +${values.flat}`);
  if (values.add_dkh) effects.push(`เพิ่มจำนวนลูกเต๋า d/kh +${values.add_dkh}`);
  if (values.cap_floor) effects.push(`เพิ่มแต้มขั้นต่ำและสูงสุด +${values.cap_floor}`);
  if (values.self_heal_stamina) effects.push(`ฟื้นฟู stamina ตัวเอง +${values.self_heal_stamina}`);
  if (values.modify_current_speed) effects.push(`เพิ่มอัตราเร่ง ${values.modify_current_speed} ระดับ`);
  if (values.race_speed) effects.push(`เพิ่ม Speed ในรัน +${values.race_speed}`);
  return effects.length ? effects : ["ยังไม่ได้ตั้งค่าโซน"];
}

export default function TeamMemberProfileModal({ member, detail, loading, error, onClose, onOpenRace }) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const profile = detail?.profile || {};
  const races = Array.isArray(detail?.history) ? detail.history : [];
  const equippedSkills = skillSlots
    .map((slot) => detail?.skills?.[slot])
    .filter((skill) => skill && !skill.missing);
  const imageUrl = toAbsoluteBotUrl(profile.profile_image_url || profile.image_url || member.image_url);
  const name = profile.username || profile.name || member.username || member.name;
  const zone = profile.zone || {};

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (selectedSkill) setSelectedSkill(null);
      else onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, selectedSkill]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <div className="team-member-profile-backdrop profile-theme-trainee profile-theme-portal" role="presentation" onMouseDown={onClose}>
      <section className="team-member-profile-modal" role="dialog" aria-modal="true" aria-labelledby="team-member-profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="team-member-profile-close" onClick={onClose} aria-label="Close profile">×</button>
        <header className="team-member-profile-hero">
          {imageUrl ? <img src={imageUrl} alt={name} /> : <div className="team-member-profile-avatar-placeholder">👤</div>}
          <div>
            <span>Umamusume trainee</span>
            <h2 id="team-member-profile-title">{name}</h2>
            <p>Team member profile</p>
          </div>
          <div className="team-member-profile-fans"><span>Fans Point</span><strong>{formatFans(profile.fans ?? member.fans)}</strong></div>
        </header>

        {loading ? <p className="team-member-profile-status">กำลังโหลดโปรไฟล์...</p> : error ? <p className="team-member-profile-status is-error">{error}</p> : (
          <div className="team-member-profile-content">
            <section className="team-member-profile-section">
              <h3>Stats</h3>
              <div className="stats-grid team-member-stats-grid">
                {mainStats.map((stat) => <StatCell key={stat.key} statKey={stat.key} label={stat.label} value={profile[stat.key]} />)}
              </div>
            </section>

            <section className="team-member-profile-section">
              <h3>Aptitude</h3>
              <div className="team-member-aptitude-grid">
                {aptitudeRows.map((row) => <div className="team-member-aptitude-group" key={row.title}>
                  <span>{row.title}</span>
                  <div>{row.items.map((item) => <AptitudeItem key={item.key} label={item.label} value={profile[item.key]} />)}</div>
                </div>)}
              </div>
            </section>

            <section className="team-member-profile-section">
              <h3>Skill</h3>
              {equippedSkills.length ? <div className="team-member-skill-list">
                {equippedSkills.map((skill) => <button type="button" className="team-member-skill" key={skill.id} onClick={() => setSelectedSkill(skill)}>
                  <div className="skill-icon-box">{getSkillIcon(skill.icon)}</div>
                  <div><strong>{skill.name || skill.id}</strong><span>{skill.id}</span></div>
                  <small>CD {skill.cooldown ?? 0}</small>
                </button>)}
              </div> : <p className="team-member-profile-empty">ยังไม่ได้ติดตั้งสกิล</p>}
            </section>

            <section className="team-member-profile-section">
              <h3>Zone</h3>
              <article className={`team-member-zone${zone.image_url ? "" : " team-member-zone--no-image"}`}>
                {zone.image_url ? <img src={toAbsoluteBotUrl(zone.image_url)} alt={zone.name || "Zone"} /> : null}
                <div><strong>{zone.name || "ชื่อ Zone"}</strong>{zoneEffects(zone.build).map((effect) => <span key={effect}>{effect}</span>)}</div>
              </article>
            </section>

            <section className="team-member-profile-section">
              <h3>Race record ({races.length})</h3>
              {races.length ? <div className="team-member-race-list">
                {races.map((race, index) => <button type="button" className="team-member-race-row" key={race.race_id || race.id || `${raceName(race)}-${index}`} onClick={() => onOpenRace?.(race)}>
                  <time>{formatDate(race.finished_at || race.finishedAt || race.date)}</time>
                  <span><strong>{raceName(race)}</strong><em>{race.track || race.track_type || race.race?.track || "-"}</em></span>
                  <b>{racePlacement(race)}</b>
                </button>)}
              </div> : <p className="team-member-profile-empty">ยังไม่มีประวัติการแข่งขัน</p>}
            </section>
          </div>
        )}
      </section>
      {selectedSkill && createPortal(
        <div className="skill-loadout-detail-backdrop team-member-skill-detail-backdrop" onMouseDown={(event) => { event.stopPropagation(); setSelectedSkill(null); }}>
          <section className="skill-loadout-detail-modal" role="dialog" aria-modal="true" aria-labelledby="team-member-skill-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="skill-loadout-detail-close" aria-label="Close skill details" onClick={() => setSelectedSkill(null)}>×</button>
            <div className="skill-loadout-detail-heading">
              <div className="skill-icon-box">{getSkillIcon(selectedSkill.icon)}</div>
              <div><span>{selectedSkill.id}</span><h3 id="team-member-skill-detail-title">{selectedSkill.name}</h3></div>
            </div>
            <div className="skill-loadout-detail-meta">
              <span>CD {selectedSkill.cooldown ?? 0}</span>
              <span>Cost {selectedSkill.cost ?? 0}</span>
              {selectedSkill.target ? <span>{renderTextWithIcons(selectedSkill.target)}</span> : null}
            </div>
            {selectedSkill.trigger ? <p><strong>เงื่อนไข:</strong> {renderTextWithIcons(selectedSkill.trigger)}</p> : null}
            {Array.isArray(selectedSkill.effects) && selectedSkill.effects.length ? <div className="skill-loadout-detail-effects">
              <strong>ผลของสกิล</strong>
              <ul>{selectedSkill.effects.map((effect, index) => <li key={`${selectedSkill.id}-${index}`}>{renderTextWithIcons(describeRaceEffect(effect))}</li>)}</ul>
            </div> : null}
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
