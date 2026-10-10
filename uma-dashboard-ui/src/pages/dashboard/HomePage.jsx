import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, CalendarDays, ChevronRight, Flag, Sparkles, Trophy } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import NewsListingCard from "../../components/NewsListingCard";
import NewsDetailsModal from "../../components/NewsDetailsModal";
import { getNewsKind } from "../../utils/newsItems";
import "../../styles/homePage.css";

function bangkokDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseBangkokDate(value, time = "00:00") {
  if (!value) return null;
  let dateValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) dateValue = `${dateValue}T${time || "00:00"}`;
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(dateValue)) dateValue += "+07:00";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getEventStart(item) {
  return parseBangkokDate(
    item.start_at || item.starts_at || item.datetime || item.date,
    item.time || "00:00"
  );
}

function getEventEnd(item, start) {
  const end = parseBangkokDate(
    item.end_at || item.ends_at || item.end_datetime || item.end_date,
    item.end_time || "23:59:59"
  );
  return end || parseBangkokDate(bangkokDateKey(start), "23:59:59");
}

export default function HomePage({ username, userId, profileType, onNavigate }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

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

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return items
      .filter((item) => getNewsKind(item) === "event")
      .map((item) => {
        const start = getEventStart(item);
        return { item, start, end: start ? getEventEnd(item, start) : null };
      })
      .filter(({ start, end }) => start && end && end >= now)
      .sort((a, b) => {
        const aIsOngoing = a.start <= now;
        const bIsOngoing = b.start <= now;
        if (aIsOngoing !== bIsOngoing) return aIsOngoing ? -1 : 1;
        return aIsOngoing ? a.end - b.end : a.start - b.start;
      })
      .slice(0, 6);
  }, [items]);

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
            <p>กิจกรรมที่กำลังดำเนินอยู่และกำลังจะมาถึง</p>
          </div>
          <button type="button" className="home-view-all" onClick={() => onNavigate("news")}>ดูตารางทั้งหมด <ChevronRight size={17} /></button>
        </header>

        <div className="home-event-summary"><span>UPCOMING EVENTS</span><span>{upcomingEvents.length} / 6 รายการ</span></div>
        {upcomingEvents.length ? <div className="home-event-grid">
          {upcomingEvents.map(({ item }, index) => <div className="home-event-item" key={`${item.id}-${item.date}-${item.time}`}><span className="home-event-index">{String(index + 1).padStart(2, "0")}</span><NewsListingCard item={item} compact onDetails={setSelectedItem} /></div>)}
        </div> : <div className="home-empty-events"><Trophy size={22} /><span>ยังไม่มีกิจกรรมที่กำลังมาถึงหรือกำลังดำเนินอยู่</span></div>}
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
