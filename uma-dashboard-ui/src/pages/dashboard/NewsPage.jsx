import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import { GameCard, SectionHeader } from "../../components/ui";
import NewsListingCard from "../../components/NewsListingCard";
import NewsDetailsModal from "../../components/NewsDetailsModal";
import "../../styles/newsPage.css";

function monthLabel(key) {
  const [year, month] = key.split("-");
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" })
    .format(new Date(Number(year), Number(month) - 1, 1));
}

const MONTH_SHORT_LABELS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function monthShortLabel(key) {
  return MONTH_SHORT_LABELS[Number(key.slice(-2)) - 1] || key;
}

function currentBangkokMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}`;
}

export default function NewsPage({ userId, profileType }) {
  const [items, setItems] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/news`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((error) => { if (error.name !== "AbortError") console.error(error); });
    return () => controller.abort();
  }, []);

  const ordered = useMemo(() => [...items].sort((a, b) => (
    `${a.date || ""}T${a.time || ""}`.localeCompare(`${b.date || ""}T${b.time || ""}`)
  )), [items]);
  const months = useMemo(() => [...new Set(ordered.map((item) => String(item.date || "").slice(0, 7)).filter(Boolean))], [ordered]);
  const currentMonth = useMemo(currentBangkokMonthKey, []);
  const activeMonth = selectedMonth || (months.includes(currentMonth) ? currentMonth : months[0]) || "";
  const visibleItems = ordered.filter((item) => String(item.date || "").startsWith(activeMonth));

  return <main className="news-page" aria-label="News">
    <GameCard as="header" className="news-page-header-card">
      <SectionHeader kicker="Community board" title="News" titleClassName="news-page-title" />
      <p className="news-page-description">กำหนดการ Event และการแข่งขันทั้งหมด เรียงตามวันเวลา GMT+7</p>
    </GameCard>

    <nav className="news-month-tabs" aria-label="เลือกเดือน">
      {months.map((month) => <button type="button" key={month} className={activeMonth === month ? "is-active" : ""} aria-label={monthLabel(month)} onClick={() => setSelectedMonth(month)}>{monthShortLabel(month)}</button>)}
    </nav>

    <section className="news-month-section" aria-label={activeMonth ? monthLabel(activeMonth) : "News"}>
      <div className="news-month-title"><CalendarDays size={22} /><h2>{activeMonth ? monthLabel(activeMonth) : "ยังไม่มีรายการ"}</h2><span>{visibleItems.length} รายการ</span></div>
      <div className="news-page-list">
        {visibleItems.map((item) => <NewsListingCard key={`${item.id}-${item.date}-${item.time}`} item={item} onDetails={setSelectedItem} />)}
        {!visibleItems.length ? <p className="news-empty">ยังไม่มี Event หรือการแข่งขันในเดือนนี้</p> : null}
      </div>
    </section>
    <NewsDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} userId={userId} profileType={profileType} />
  </main>;
}
