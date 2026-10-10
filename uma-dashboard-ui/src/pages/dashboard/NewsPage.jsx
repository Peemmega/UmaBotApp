import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import { GameCard, SectionHeader } from "../../components/ui";
import NewsListingCard from "../../components/NewsListingCard";
import NewsDetailsModal from "../../components/NewsDetailsModal";
import { getNewsKind } from "../../utils/newsItems";
import "../../styles/newsPage.css";

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
  const timestamp = item.start_at || item.starts_at || item.datetime;
  return parseBangkokDate(timestamp || item.date, item.time || "00:00");
}

function getEventEnd(item, start) {
  const timestamp = item.end_at || item.ends_at || item.end_datetime;
  const explicitEnd = parseBangkokDate(timestamp || item.end_date, item.end_time || "23:59:59");
  if (explicitEnd) return explicitEnd;

  return parseBangkokDate(bangkokDateKey(start), "23:59:59");
}

export default function NewsPage({ userId, profileType }) {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const closeOverlays = () => setSelectedItem(null);
    window.addEventListener("uma:close-overlays", closeOverlays);
    return () => window.removeEventListener("uma:close-overlays", closeOverlays);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/news`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.name !== "AbortError") console.error(error); });
    return () => controller.abort();
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

  return <main className="news-page" aria-label="News">
    <GameCard as="header" className="news-page-header-card">
      <SectionHeader kicker="Community board" title="News & Events" titleClassName="news-page-title" />
      <p className="news-page-description">รวมกิจกรรมที่กำลังจะมาถึงและกิจกรรมที่กำลังดำเนินอยู่</p>
    </GameCard>

    <section className="news-upcoming-section" aria-labelledby="news-upcoming-title">
      <div className="news-month-title">
        <CalendarDays size={22} />
        <h2 id="news-upcoming-title">กิจกรรมที่กำลังมาถึง</h2>
        <span>{upcomingEvents.length} / 6 รายการ</span>
      </div>
      {upcomingEvents.length ? <div className="news-upcoming-grid">
        {upcomingEvents.map(({ item }) => <NewsListingCard key={`${item.id}-${item.date}-${item.time}`} item={item} compact onDetails={setSelectedItem} />)}
      </div> : <p className="news-empty">ยังไม่มีกิจกรรมที่กำลังมาถึงหรือกำลังดำเนินอยู่</p>}
    </section>
    <NewsDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} userId={userId} profileType={profileType} />
  </main>;
}
