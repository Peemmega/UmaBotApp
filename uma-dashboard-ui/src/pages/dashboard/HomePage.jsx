import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowDownRight, CalendarDays, ChevronRight, Flag, Sparkles, Trophy } from "lucide-react";
import { Reveal } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { BOT_API_BASE } from "../../api/playerApi";
import NewsListingCard from "../../components/NewsListingCard";
import { getNewsKind } from "../../utils/newsItems";
import homeHeroImage from "../../assets/bg/Home_Image.webp";
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

function bangkokMonthKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}`;
}

function formatBangkokMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
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

export default function HomePage({ username, onNavigate, onOpenNews }) {
  const [items, setItems] = useState([]);
  const [activeMonthEvent, setActiveMonthEvent] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState(1);
  const [activeNewsFilter, setActiveNewsFilter] = useState("all");
  const prefersReducedMotion = useReducedMotion();
  const currentMonth = bangkokMonthKey(new Date());

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/news`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.name !== "AbortError") console.error(error); });
    return () => controller.abort();
  }, []);

  const thisMonthEvents = useMemo(() => {
    return items
      .filter((item) => getNewsKind(item) === "event" && String(item.date || "").startsWith(currentMonth))
      .map((item) => {
        const start = getEventStart(item);
        return { item, start };
      })
      .filter(({ start }) => start)
      .sort((a, b) => a.start - b.start)
      .slice(0, 6);
  }, [items, currentMonth]);

  const filteredHomeItems = useMemo(() => {
    const now = new Date();
    const eligibleItems = items
      .map((item) => {
        const kind = getNewsKind(item);
        const start = getEventStart(item);
        const end = start ? getEventEnd(item, start) : null;
        return { item, kind, start, end };
      })
      .filter(({ kind, start, end }) => {
        if (activeNewsFilter !== "all" && kind !== activeNewsFilter) return false;
        if (kind === "event" || kind === "race") return start && end && end >= now;
        return true;
      });

    return eligibleItems
      .sort((a, b) => {
        const aIsSchedule = a.kind === "event" || a.kind === "race";
        const bIsSchedule = b.kind === "event" || b.kind === "race";
        if (aIsSchedule !== bIsSchedule) return aIsSchedule ? -1 : 1;
        if (aIsSchedule) {
          const aIsOngoing = a.start <= now;
          const bIsOngoing = b.start <= now;
          if (aIsOngoing !== bIsOngoing) return aIsOngoing ? -1 : 1;
          return aIsOngoing ? a.end - b.end : a.start - b.start;
        }
        return (b.start?.getTime() || 0) - (a.start?.getTime() || 0);
      })
      .slice(0, 6);
  }, [items, activeNewsFilter]);

  const activeMonthEventIndex = thisMonthEvents.length
    ? activeMonthEvent % thisMonthEvents.length
    : 0;
  const activeMonthEventItem = thisMonthEvents[activeMonthEventIndex];

  const changeMonthEvent = (direction) => {
    if (thisMonthEvents.length < 2) return;
    setCarouselDirection(direction);
    setActiveMonthEvent((index) => (index + direction + thisMonthEvents.length) % thisMonthEvents.length);
  };

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-shade" role="img" aria-label="กลุ่มนักเรียนสาวหูม้าวิ่งในสนามโรงเรียน" style={{ "--home-hero-image": `url("${homeHeroImage}")` }} />
        <Reveal className="home-hero-copy">
          <span className="home-eyebrow"><Sparkles size={15} /> TRACEN ACADEMY · COMMUNITY HUB</span>
          <h1 id="home-title">วันใหม่ในรั้ว<br /><span>โรงเรียนเทรนเซ็น</span></h1>
          <p>{username ? `สวัสดี ${username} พร้อมออกวิ่งไปกับเพื่อน ๆ แล้วหรือยัง?` : "พร้อมออกวิ่งไปกับเพื่อน ๆ แล้วหรือยัง?"}<br />ติดตามกิจกรรมและเตรียมตัวลงสนามได้ที่นี่</p>
          <div className="home-hero-actions">
            <button type="button" className="home-primary-action" onClick={() => onNavigate("races")}><Flag size={17} /> เข้าสู่สนามแข่ง <ChevronRight size={17} /></button>
            <button type="button" className="home-secondary-action" onClick={() => onNavigate("profile")}>ดูโปรไฟล์ <ArrowDownRight size={16} /></button>
          </div>
        </Reveal>
        <div className="home-hero-note" aria-hidden="true"><ArrowDown size={16} /><span>ข่าวสารจากโรงเรียน</span></div>
      </section>

      <section className="home-events" aria-labelledby="home-events-title">
        <Reveal as="header" className="home-section-heading">
          <div>
            <h2 id="home-events-title">ข่าวสาร &amp; กิจกรรม</h2>
            <p>กิจกรรมและการแข่งขันที่กำลังดำเนินอยู่หรือกำลังจะมาถึง</p>
          </div>
          <button type="button" className="home-view-all" onClick={() => onNavigate("news")}>ดูตารางทั้งหมด <ChevronRight size={17} /></button>
        </Reveal>

        <div className="home-events-layout">
          <section className="home-month-panel" aria-labelledby="home-month-title">
            <header className="home-month-heading">
              <div>
                <span className="home-month-kicker"><CalendarDays size={14} /> MONTHLY EVENTS</span>
                <h3 id="home-month-title">{formatBangkokMonth(currentMonth)}</h3>
              </div>
              <span className="home-month-count">{thisMonthEvents.length} รายการ</span>
            </header>
            {activeMonthEventItem ? <div className="home-month-carousel" aria-label="กิจกรรมประจำเดือน">
              <AnimatePresence mode="wait" initial={false} custom={carouselDirection}>
                <motion.div
                  className="home-month-slide"
                  key={`${activeMonthEventItem.item.id}-${activeMonthEventItem.item.date}-${activeMonthEventItem.item.time}`}
                  custom={carouselDirection}
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : carouselDirection * 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: prefersReducedMotion ? 0 : carouselDirection * -20 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: "easeOut" }}
                  aria-live="polite"
                >
                  <NewsListingCard item={activeMonthEventItem.item} onDetails={onOpenNews} />
                </motion.div>
              </AnimatePresence>
              <div className="home-month-controls" aria-label="เปลี่ยนกิจกรรม">
                <span className="home-month-position">{String(activeMonthEventIndex + 1).padStart(2, "0")} / {String(thisMonthEvents.length).padStart(2, "0")}</span>
                <div className="home-month-arrows">
                  <button type="button" aria-label="กิจกรรมก่อนหน้า" onClick={() => changeMonthEvent(-1)} disabled={thisMonthEvents.length < 2}><ChevronRight size={16} aria-hidden="true" /></button>
                  <button type="button" aria-label="กิจกรรมถัดไป" onClick={() => changeMonthEvent(1)} disabled={thisMonthEvents.length < 2}><ChevronRight size={16} aria-hidden="true" /></button>
                </div>
              </div>
            </div> : <p className="home-month-empty">เดือนนี้ยังไม่มี Event</p>}
            {/* <button type="button" className="home-month-more" onClick={() => onNavigate("news")}>ดู Event ทั้งเดือน <ChevronRight size={15} /></button> */}
          </section>

          <section className="home-upcoming-panel" aria-label="กิจกรรมและการแข่งขันที่กำลังมาถึง">
            <div className="home-event-summary"><span>NEWS &amp; EVENTS</span><span>{filteredHomeItems.length} / 6 รายการ</span></div>
            <nav className="home-news-filters" aria-label="กรองข่าวสาร">
              {[
                ["all", "ข่าวทั้งหมด"],
                ["event", "กิจกรรม"],
                ["race", "การแข่ง"],
                ["patch", "แพตช์โน้ต"],
              ].map(([filter, label]) => <button
                type="button"
                key={filter}
                className={activeNewsFilter === filter ? "is-active" : ""}
                aria-pressed={activeNewsFilter === filter}
                onClick={() => setActiveNewsFilter(filter)}
              >{label}</button>)}
            </nav>
            {filteredHomeItems.length ? <StaggerContainer className={`home-event-grid${filteredHomeItems.length > 3 ? " is-filling" : ""}`}>
              {filteredHomeItems.map(({ item }) => <StaggerItem className="home-event-item" key={`${item.id}-${item.date}-${item.time}`}><NewsListingCard item={item} compact onDetails={onOpenNews} /></StaggerItem>)}
            </StaggerContainer> : <Reveal className="home-empty-events"><Trophy size={22} /><span>ยังไม่มีรายการในหมวดนี้</span></Reveal>}
          </section>
        </div>
      </section>

      <Reveal as="section" className="home-lower-note">
        <span className="home-note-icon"><Sparkles size={19} /></span>
        <div><strong>ทุกก้าวคือเรื่องราวบทใหม่</strong><span>แวะเช็กกำหนดการ แล้วชวนเพื่อนในทีมไปสนุกด้วยกัน</span></div>
        <button type="button" onClick={() => onNavigate("chars")}>พบกับเพื่อนร่วมทีม <ChevronRight size={17} /></button>
      </Reveal>
    </main>
  );
}
