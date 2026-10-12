import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { SYSTEM_TOPICS, followSystemLink } from "../data/systemGuide";
import { raceImageMap } from "../utils/raceSchedule";
import "../styles/commuSystemSection.css";

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
  const [slideDirection, setSlideDirection] = useState("forward");
  const topic = SYSTEM_TOPICS[activeIndex];
  const select = (index) => {
    const nextIndex = (index + SYSTEM_TOPICS.length) % SYSTEM_TOPICS.length;
    if (nextIndex === activeIndex) return;
    const forwardDistance = (nextIndex - activeIndex + SYSTEM_TOPICS.length) % SYSTEM_TOPICS.length;
    setSlideDirection(forwardDistance <= SYSTEM_TOPICS.length / 2 ? "forward" : "backward");
    setActiveIndex(nextIndex);
  };
  return <section className="commu-system" id="race-system" aria-labelledby="commu-system-title">
    <header className="commu-system-heading"><h2 id="commu-system-title">Race System</h2></header>
    <div className="commu-system-stage">
      {[-1, 1].map((offset) => {
        const preview = SYSTEM_TOPICS[(activeIndex + offset + SYSTEM_TOPICS.length) % SYSTEM_TOPICS.length];
        return <button type="button" className={`commu-system-preview is-${offset < 0 ? "previous" : "next"}`} key={offset} onClick={() => select(activeIndex + offset)} aria-label={`ดูหัวข้อ ${preview.label}`}>
          <span className={`commu-system-preview-content from-${slideDirection}`} key={preview.id}>
            <span className={`commu-system-art is-${preview.id}`}><img src={preview.image} alt="" loading="lazy" /></span>
            <span className="commu-system-preview-copy"><strong>{preview.label}</strong><span>{preview.title}</span></span>
          </span>
        </button>;
      })}
      <div className="commu-system-panel">
        <a className={`commu-system-feature from-${slideDirection}`} key={topic.id} href={`/dashboard/system/${topic.id}`} onClick={(event) => followSystemLink(event, onNavigate, topic.id)}>
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
