import { useState } from "react";
import { Activity, ArrowUpRight, ChevronLeft, ChevronRight, Flag, Trophy, Zap } from "lucide-react";
import { SYSTEM_TOPICS, followSystemLink } from "../data/systemGuide";
import { raceImageMap } from "../utils/raceSchedule";
import "../styles/commuSystemSection.css";

const ICONS = [Activity, Trophy, Flag, Zap];
const RACE_COLUMNS = Array.from({ length: 3 }, (_, column) => Object.entries(raceImageMap).filter((_, index) => index % 3 === column));

export function RaceGallery() {
  return <div className="commu-race-gallery" role="img" aria-label="ภาพสนามแข่งที่เลื่อนวนอย่างต่อเนื่อง">
    <div className="commu-race-columns" aria-hidden="true">
      {RACE_COLUMNS.map((races, column) => <div className="commu-race-column" key={column} style={{ "--column-duration": `${65 + column * 9}s`, "--column-delay": `${column * -12}s` }}>
        {[0, 1].map((group) => <div className="commu-race-set" key={group}>
          {races.map(([id, image]) => <div className="commu-race-thumb" key={`${id}-${group}`}><img src={image} alt="" loading="lazy" /></div>)}
        </div>)}
      </div>)}
    </div>
  </div>;
}

export default function CommuSystemSection({ onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const topic = SYSTEM_TOPICS[activeIndex];
  const select = (index) => setActiveIndex((index + SYSTEM_TOPICS.length) % SYSTEM_TOPICS.length);
  const onTabKeyDown = (event, index) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % SYSTEM_TOPICS.length;
    if (event.key === "ArrowLeft") next = (index + SYSTEM_TOPICS.length - 1) % SYSTEM_TOPICS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = SYSTEM_TOPICS.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    select(next);
    document.getElementById(`commu-tab-${SYSTEM_TOPICS[next].id}`)?.focus();
  };

  return <section className="commu-system" id="race-system" aria-labelledby="commu-system-title">
    <header className="commu-system-heading"><h2 id="commu-system-title">Race System</h2><p>รู้จักสนาม วางแผนวิ่ง แล้วสร้างจังหวะของคุณใน Twinkle Series</p></header>
    <div className="commu-system-tabs" role="tablist" aria-label="หัวข้อระบบการแข่งขัน">
      {SYSTEM_TOPICS.map((item, index) => {
        const Icon = ICONS[index];
        return <button type="button" role="tab" key={item.id} id={`commu-tab-${item.id}`} aria-selected={activeIndex === index} aria-controls="commu-system-panel" tabIndex={activeIndex === index ? 0 : -1} className={activeIndex === index ? "is-active" : ""} onClick={() => select(index)} onKeyDown={(event) => onTabKeyDown(event, index)}><Icon size={18} /><span>{item.label}</span></button>;
      })}
    </div>
    <div className="commu-system-stage">
      {[-1, 1].map((offset) => {
        const preview = SYSTEM_TOPICS[(activeIndex + offset + SYSTEM_TOPICS.length) % SYSTEM_TOPICS.length];
        return <button type="button" className={`commu-system-preview is-${offset < 0 ? "previous" : "next"}`} key={offset} onClick={() => select(activeIndex + offset)} aria-label={`ดูหัวข้อ ${preview.label}`}>
          <span className={`commu-system-art is-${preview.id}`}><img src={preview.image} alt="" loading="lazy" /></span>
          <span className="commu-system-preview-copy"><strong>{preview.label}</strong><span>{preview.title}</span></span>
        </button>;
      })}
      <div className="commu-system-panel" id="commu-system-panel" role="tabpanel" aria-labelledby={`commu-tab-${topic.id}`}>
        <a className="commu-system-feature" href={`/dashboard/system/${topic.id}`} onClick={(event) => followSystemLink(event, onNavigate, topic.id)}>
          <div className={`commu-system-art is-${topic.id}`}>
            {topic.id === "races" ? <RaceGallery /> : <img src={topic.image} alt={topic.imageAlt} loading="lazy" />}
            <span className="commu-system-image-label">{topic.label}</span>
          </div>
          <div className="commu-system-caption"><h3>{topic.title}</h3><p>{topic.caption}</p><span className="commu-system-read">อ่านรายละเอียด <ArrowUpRight size={17} /></span></div>
        </a>
      </div>
      <button type="button" className="commu-system-arrow is-previous" onClick={() => select(activeIndex - 1)} aria-label="หัวข้อก่อนหน้า"><ChevronLeft size={28} /></button>
      <button type="button" className="commu-system-arrow is-next" onClick={() => select(activeIndex + 1)} aria-label="หัวข้อถัดไป"><ChevronRight size={28} /></button>
    </div>
    <div className="commu-system-dots" aria-label="เลือกหัวข้อระบบ">
      {SYSTEM_TOPICS.map((item, index) => <button type="button" key={item.id} className={index === activeIndex ? "is-active" : ""} aria-label={item.label} aria-pressed={index === activeIndex} onClick={() => select(index)}><span /></button>)}
    </div>
  </section>;
}
