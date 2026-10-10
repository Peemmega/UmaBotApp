import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowLeft, ArrowRight, CalendarDays, ChevronRight, Flag, Sparkles, Trophy } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import NewsListingCard from "../../components/NewsListingCard";
import NewsDetailsModal from "../../components/NewsDetailsModal";
import { getNewsKind } from "../../utils/newsItems";
import "../../styles/homePage.css";

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "event", label: "อีเวนต์" },
  { key: "race", label: "การแข่งขัน" },
];

export default function HomePage({ username, userId, profileType, onNavigate }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/news`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.name !== "AbortError") console.error(error); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const closeOverlays = () => setSelectedItem(null);
    window.addEventListener("uma:close-overlays", closeOverlays);
    return () => window.removeEventListener("uma:close-overlays", closeOverlays);
  }, []);

  const visibleItems = useMemo(() => [...items]
    .filter((item) => filter === "all" || getNewsKind(item) === filter)
    .sort((a, b) => `${b.date || ""}T${b.time || ""}`.localeCompare(`${a.date || ""}T${a.time || ""}`)), [items, filter]);

  const scrollEvents = (direction) => {
    listRef.current?.scrollBy({ left: direction * Math.max(listRef.current.clientWidth * 0.78, 280), behavior: "smooth" });
  };

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <img className="home-hero-art" src="/home-hero.png" alt="นักเรียนสาวหูม้าวิ่งอยู่บนสนามของโรงเรียน" />
        <div className="home-hero-shade" aria-hidden="true" />
        <div className="home-hero-copy">
          <span className="home-eyebrow"><Sparkles size={15} /> TRACEN ACADEMY · COMMUNITY HUB</span>
          <h1 id="home-title">วันใหม่ในรั้ว<br /><span>โรงเรียนเทรนเซ็น</span></h1>
          <p>{username ? `สวัสดี ${username} พร้อมออกวิ่งไปกับเพื่อน ๆ แล้วหรือยัง?` : "พร้อมออกวิ่งไปกับเพื่อน ๆ แล้วหรือยัง?"}<br />ติดตามกิจกรรมและเตรียมตัวลงสนามได้ที่นี่</p>
          <div className="home-hero-actions">
            <button type="button" className="home-primary-action" onClick={() => onNavigate("races")}><Flag size={17} /> เข้าสู่สนามแข่ง <ChevronRight size={17} /></button>
            <button type="button" className="home-secondary-action" onClick={() => onNavigate("profile")}>ดูโปรไฟล์ <ArrowDownRight size={16} /></button>
          </div>
        </div>
        <div className="home-hero-note"><span>01</span><span>TRAIN · GROW · RUN</span></div>
      </section>

      <section className="home-events" aria-labelledby="home-events-title">
        <header className="home-section-heading">
          <div>
            <span className="home-eyebrow home-eyebrow-dark"><CalendarDays size={15} /> CAMPUS BULLETIN</span>
            <h2 id="home-events-title">ข่าวสาร &amp; กิจกรรม</h2>
            <p>เรื่องราวและการแข่งขันที่กำลังเกิดขึ้นในโรงเรียน</p>
          </div>
          <button type="button" className="home-view-all" onClick={() => onNavigate("news")}>ดูตารางทั้งหมด <ChevronRight size={17} /></button>
        </header>

        <div className="home-event-toolbar">
          <div className="home-filter-tabs" role="tablist" aria-label="กรองกิจกรรม">
            {FILTERS.map((option) => <button type="button" role="tab" aria-selected={filter === option.key} className={filter === option.key ? "is-active" : ""} key={option.key} onClick={() => setFilter(option.key)}>{option.label}</button>)}
          </div>
          <div className="home-event-controls">
            <span>{visibleItems.length.toString().padStart(2, "0")} รายการ</span>
            <button type="button" aria-label="เลื่อนกิจกรรมไปทางซ้าย" onClick={() => scrollEvents(-1)}><ArrowLeft size={17} /></button>
            <button type="button" aria-label="เลื่อนกิจกรรมไปทางขวา" onClick={() => scrollEvents(1)}><ArrowRight size={17} /></button>
          </div>
        </div>

        {visibleItems.length ? <div className="home-event-track" ref={listRef}>
          {visibleItems.map((item, index) => <div className="home-event-item" key={`${item.id}-${item.date}-${item.time}`}><span className="home-event-index">{String(index + 1).padStart(2, "0")}</span><NewsListingCard item={item} onDetails={setSelectedItem} /></div>)}
        </div> : <div className="home-empty-events"><Trophy size={22} /><span>ยังไม่มีกิจกรรมในหมวดนี้ ลองเลือกหมวดอื่นดูนะ</span></div>}
      </section>

      <section className="home-lower-note">
        <span className="home-note-icon"><Sparkles size={19} /></span>
        <div><strong>ทุกก้าวคือเรื่องราวบทใหม่</strong><span>แวะเช็กกำหนดการ แล้วชวนเพื่อนในทีมไปสนุกด้วยกัน</span></div>
        <button type="button" onClick={() => onNavigate("chars")}>พบกับเพื่อนร่วมทีม <ChevronRight size={17} /></button>
      </section>

      <NewsDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} userId={userId} profileType={profileType} />
    </main>
  );
}
