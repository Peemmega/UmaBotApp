import { useState } from "react";
import { Activity, ArrowRight, Flag, Sparkles, Trophy, Zap } from "lucide-react";
import { raceImageMap } from "../utils/raceSchedule";
import "../styles/commuSystemSection.css";

const SYSTEMS = [
  {
    id: "stats",
    label: "Stats",
    Icon: Activity,
    title: "ปั้นนักวิ่งในแบบของคุณ",
    description: "จัดสรร Speed, Stamina, Power, Guts และ Wit แล้วดูว่าค่าสเตตัสส่งผลต่อแผนลงสนามอย่างไร",
    note: "ดูโปรไฟล์และปรับแต้มฝึกซ้อมได้จากหน้าโปรไฟล์",
    destination: "profile",
    action: "จัด Stats",
  },
  {
    id: "skills",
    label: "Skills / Zone",
    Icon: Sparkles,
    title: "ต่อยอดแผนด้วย Skills และ Zone",
    description: "เลือกสกิลที่เหมาะกับจังหวะการแข่งขัน พร้อมจัด Zone เพื่อเสริมความสามารถให้เข้ากับทีมของคุณ",
    note: "สกิลและเอฟเฟกต์ Zone จะมีรายละเอียดให้ตรวจดูก่อนใช้งาน",
    destination: "skills",
    action: "จัด Skills",
    secondaryDestination: "profile",
    secondaryAction: "ตั้งค่า Zone",
  },
  {
    id: "races",
    label: "สนามแข่ง",
    Icon: Trophy,
    title: "เลือกสนาม แล้ววางแผนก่อนออกตัว",
    description: "เลือกจากรายการแข่งกว่า 100 แบบ เช็กกำหนดการ แล้วเตรียมทีมให้พร้อมกับสนามถัดไป",
    note: "ดูตารางรายการแข่งและผลการแข่งขันย้อนหลังได้",
    destination: "races",
    action: "เปิดสนามแข่ง",
  },
  {
    id: "lanes",
    label: "Lane",
    Icon: Flag,
    title: "เปลี่ยนเลนให้ทันจังหวะ",
    description: "สนามมี 6 เลน การเลือกเลนเป็นการวางคำสั่งล่วงหน้าและจะมีผลในเทิร์นถัดไป",
    note: "ดูตำแหน่งและคำสั่ง Lane ได้ระหว่างการแข่งขัน",
    destination: "tutorials",
    action: "เรียนรู้ระบบแข่ง",
  },
  {
    id: "styles",
    label: "สายการวิ่ง",
    Icon: Zap,
    title: "เลือกจังหวะวิ่งที่เข้ากับนักแข่ง",
    description: "Front, Pace, Late และ End วางตำแหน่งคนละช่วงของสนาม เลือกแผนที่เหมาะกับทีมและสไตล์ของคุณ",
    note: "สายการวิ่งใช้กำหนดรูปแบบการเล่นในห้องแข่ง",
    destination: "races",
    action: "ดูรายการแข่ง",
  },
];

const STATS = [
  { label: "Speed", value: 82, color: "speed" },
  { label: "Stamina", value: 67, color: "stamina" },
  { label: "Power", value: 74, color: "power" },
  { label: "Guts", value: 54, color: "guts" },
  { label: "Wit", value: 70, color: "wit" },
];

const STYLES = [
  { id: "Front", detail: "นำตั้งแต่ต้น", position: 12 },
  { id: "Pace", detail: "เกาะกลุ่มหน้า", position: 36 },
  { id: "Late", detail: "รอจังหวะเร่ง", position: 65 },
  { id: "End", detail: "เร่งช่วงท้าย", position: 88 },
];

const RACE_GALLERY = Object.entries(raceImageMap).map(([id, image]) => ({
  id,
  image,
  name: id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z])([A-Z][a-z])/g, "$1 $2"),
}));
const RACE_GALLERY_COLUMNS = Array.from({ length: 3 }, (_, column) =>
  RACE_GALLERY.filter((_, index) => index % 3 === column)
);

function StatsGraphic() {
  return (
    <div className="commu-build-sheet">
      <div className="commu-build-heading">
        <span className="commu-build-avatar">U</span>
        <span><b>Runner build</b><small>ตัวอย่างการกระจาย Stats</small></span>
        <strong className="commu-build-rank">A</strong>
      </div>
      <div className="commu-stat-bars">
        {STATS.map((stat) => (
          <div className="commu-stat-row" key={stat.label}>
            <span>{stat.label}</span>
            <div className="commu-stat-track"><i className={`is-${stat.color}`} style={{ "--stat-fill": `${stat.value}%` }} /></div>
            <b>{stat.value}</b>
          </div>
        ))}
      </div>
      <div className="commu-build-footer"><span>PROFILE</span><span>แต้มฝึกซ้อมปรับได้</span></div>
    </div>
  );
}

function SkillsGraphic() {
  return (
    <div className="commu-skill-board">
      <div className="commu-skill-card">
        <span className="commu-skill-icon"><Zap size={21} fill="currentColor" /></span>
        <div><small>SKILL</small><b>เลือกใช้ตามจังหวะ</b><p>ตรวจเงื่อนไขและผลก่อนจัด Loadout</p></div>
        <span className="commu-skill-ready">พร้อมใช้</span>
      </div>
      <div className="commu-zone-link"><span /><span /><span /></div>
      <div className="commu-zone-card">
        <div className="commu-zone-emblem"><Sparkles size={25} /></div>
        <div><small>TEAM ZONE</small><b>Zone ของทีม</b><p>ประกอบเอฟเฟกต์ให้เข้ากับแผน</p></div>
        <span className="commu-zone-effects"><i>STA</i><i>SPD</i></span>
      </div>
    </div>
  );
}

function RaceGraphic() {
  return (
    <div className="commu-race-gallery" aria-label="ตัวอย่างภาพจากรายการแข่งหลายสนาม">
      <div className="commu-race-gallery-heading"><span><Trophy size={14} /> RACE CALENDAR</span><b>100+ รายการแข่ง</b></div>
      <div className="commu-race-window">
        <div className="commu-race-columns" aria-hidden="true">
          {RACE_GALLERY_COLUMNS.map((races, column) => (
            <div className="commu-race-column" key={column} style={{ "--column-duration": `${52 + column * 7}s`, "--column-delay": `${column * -9}s` }}>
              {[0, 1].map((group) => <div className="commu-race-set" key={group}>
                {races.map((race) => (
                  <div className="commu-race-thumb" key={`${race.id}-${group}`}>
                    <img src={race.image} alt="" loading="lazy" />
                    <span>{race.name}</span>
                  </div>
                ))}
              </div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="commu-race-gallery-footer"><Flag size={14} /><span>เลือกสนาม · วางแผน · ออกตัว</span></div>
    </div>
  );
}

function LanesGraphic() {
  const [activeLane, setActiveLane] = useState(4);
  return (
    <div className="commu-lane-map" aria-label="ตัวอย่างสนามแข่ง 6 เลน">
      <div className="commu-lane-track-label"><span>START</span><span>FINISH</span></div>
      {Array.from({ length: 6 }, (_, index) => {
        const lane = index + 1;
        return (
          <button
            className={`commu-lane-row${lane === activeLane ? " is-selected" : ""}`}
            key={lane}
            type="button"
            onClick={() => setActiveLane(lane)}
            aria-pressed={lane === activeLane}
            aria-label={`เลือกตัวอย่าง Lane ${lane}`}
          >
            <span>{lane}</span><i />{lane === activeLane ? <b className="commu-lane-runner">U</b> : null}
          </button>
        );
      })}
      <div className="commu-lane-caption"><span className="commu-lane-dot" /> Lane {activeLane} <small>เลือกคำสั่งล่วงหน้า</small></div>
    </div>
  );
}

function StylesGraphic() {
  const [activeStyle, setActiveStyle] = useState("Pace");
  return (
    <div className="commu-style-map">
      <div className="commu-style-track"><span>START</span><i />{STYLES.map((style) => (
        <b key={style.id} className={style.id === activeStyle ? "is-active" : ""} style={{ "--runner-position": `${style.position}%` }} title={`${style.id}: ${style.detail}`}>{style.id === activeStyle ? "U" : "•"}</b>
      ))}<span>GOAL</span></div>
      <div className="commu-style-options">
        {STYLES.map((style) => (
          <button key={style.id} className={style.id === activeStyle ? "is-selected" : ""} type="button" onClick={() => setActiveStyle(style.id)} aria-pressed={style.id === activeStyle}>
            <strong>{style.id}</strong><small>{style.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function SystemVisual({ id }) {
  if (id === "stats") return <StatsGraphic />;
  if (id === "skills") return <SkillsGraphic />;
  if (id === "races") return <RaceGraphic />;
  if (id === "lanes") return <LanesGraphic />;
  return <StylesGraphic />;
}

export default function CommuSystemSection({ onNavigate }) {
  const [activeId, setActiveId] = useState("stats");
  const activeSystem = SYSTEMS.find((system) => system.id === activeId) || SYSTEMS[0];
  const Icon = activeSystem.Icon;

  return (
    <section className="commu-system" aria-labelledby="commu-system-title">
      <header className="commu-system-heading">
        <div>
          <span className="commu-system-kicker"><span /> ระบบคอมมูนิตี้ Tracen</span>
          <h2 id="commu-system-title">เตรียมทุกอย่าง<br /><em>ก่อนออกตัว</em></h2>
          <p>ระบบที่เชื่อมการฝึก สกิล และแผนการแข่งขันไว้ด้วยกัน</p>
        </div>
        <div className="commu-system-track-mark" aria-hidden="true"><span>TRACEN</span><i /><b>FINISH</b></div>
      </header>

      <div className="commu-system-tabs" role="tablist" aria-label="ระบบของคอมมูนิตี้">
        {SYSTEMS.map((system) => {
          const TabIcon = system.Icon;
          const selected = system.id === activeId;
          return (
            <button
              key={system.id}
              id={`commu-tab-${system.id}`}
              className={selected ? "is-active" : ""}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="commu-system-panel"
              onClick={() => setActiveId(system.id)}
            ><TabIcon size={16} /><span>{system.label}</span></button>
          );
        })}
      </div>

      <div className="commu-system-panel" id="commu-system-panel" role="tabpanel" aria-labelledby={`commu-tab-${activeSystem.id}`}>
        <div className="commu-system-copy">
          <span className="commu-system-type"><Icon size={15} /> {activeSystem.label}</span>
          <h3>{activeSystem.title}</h3>
          <p>{activeSystem.description}</p>
          <div className="commu-system-note"><span>↳</span>{activeSystem.note}</div>
          <div className="commu-system-actions">
            <button className="commu-system-action" type="button" onClick={() => onNavigate(activeSystem.destination)}>
              {activeSystem.action}<ArrowRight size={17} />
            </button>
            {activeSystem.secondaryAction ? <button className="commu-system-action is-secondary" type="button" onClick={() => onNavigate(activeSystem.secondaryDestination)}>
              {activeSystem.secondaryAction}<ArrowRight size={17} />
            </button> : null}
          </div>
        </div>
        <div className={`commu-system-visual is-${activeSystem.id}`}>
          <SystemVisual id={activeSystem.id} />
        </div>
      </div>
      <div className="commu-system-footer"><span>สร้างนักวิ่ง</span><i /><span>เลือกแผน</span><i /><span>ออกสู่สนาม</span></div>
    </section>
  );
}
