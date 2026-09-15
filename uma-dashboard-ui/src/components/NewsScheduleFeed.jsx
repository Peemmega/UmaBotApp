import { useEffect, useMemo, useState } from "react";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { BOT_API_BASE } from "../api/playerApi";
import { getRaceImage } from "../utils/raceSchedule";
import "../styles/newsScheduleFeed.css";

const FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "event", label: "Event" },
  { value: "race", label: "Race" },
];
const LIMITS = [3, 5, 8];
const SETTINGS_KEY = "uma-news-feed-settings";

function getKind(item) {
  return String(item.kind || "race").toLowerCase() === "event" ? "event" : "race";
}

function getDate(item) {
  const value = item.date && item.time ? `${item.date}T${item.time}` : item.date;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function timestamp(item) {
  if (!item.date) return "กำหนดการเร็ว ๆ นี้";
  return `${String(item.date).replaceAll("-", "/")} ${item.time || "—"} (ICT)`;
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      filter: FILTERS.some((item) => item.value === saved.filter) ? saved.filter : "all",
      limit: LIMITS.includes(saved.limit) ? saved.limit : 3,
    };
  } catch {
    return { filter: "all", limit: 3 };
  }
}

function getImage(item) {
  return getKind(item) === "event"
    ? item.image_url || item.thumbnail || item.image
    : getRaceImage(item);
}

function getDescription(item) {
  if (item.description) return item.description;
  return [item.venue, item.track, item.distance].filter(Boolean).join(" · ") || "รายละเอียดกำลังอัปเดต";
}

export default function NewsScheduleFeed() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/race/calendar`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const ordered = [...(Array.isArray(data) ? data : [])].sort((left, right) => (
          (getDate(left)?.getTime() || Number.MAX_SAFE_INTEGER)
          - (getDate(right)?.getTime() || Number.MAX_SAFE_INTEGER)
        ));
        const upcoming = ordered.filter((item) => (getDate(item)?.getTime() || 0) >= Date.now());
        setItems(upcoming.length ? upcoming : ordered);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const visibleItems = useMemo(() => items
    .filter((item) => settings.filter === "all" || getKind(item) === settings.filter)
    .slice(0, settings.limit), [items, settings]);

  return <section className="news-schedule-feed" aria-labelledby="news-schedule-title">
    <header className="news-schedule-header">
      <div><p>Community board</p><h3 id="news-schedule-title">News</h3></div>
      <button
        type="button"
        className="news-settings-toggle"
        aria-label="ตั้งค่าการแสดง News"
        aria-expanded={isSettingsOpen}
        onClick={() => setIsSettingsOpen((current) => !current)}
      >
        {isSettingsOpen ? <X size={17} /> : <SlidersHorizontal size={17} />}
      </button>
    </header>

    {isSettingsOpen ? <div className="news-feed-settings">
      <div className="news-filter-options" role="group" aria-label="ชนิดข่าว">
        {FILTERS.map((filter) => <button
          type="button"
          key={filter.value}
          className={settings.filter === filter.value ? "is-active" : ""}
          onClick={() => setSettings((current) => ({ ...current, filter: filter.value }))}
        >{filter.label}</button>)}
      </div>
      <label>จำนวนที่แสดง
        <select value={settings.limit} onChange={(event) => setSettings((current) => ({ ...current, limit: Number(event.target.value) }))}>
          {LIMITS.map((limit) => <option key={limit} value={limit}>{limit} รายการ</option>)}
        </select>
      </label>
    </div> : null}

    <div className="news-card-list">
      {visibleItems.map((item) => {
        const kind = getKind(item);
        const image = getImage(item);
        return <article className="news-card" key={`${item.id}-${item.date}-${item.time}`}>
          {image ? <img className="news-card-banner" src={image} alt="" loading="lazy" /> : null}
          <div className="news-card-content">
            <div className="news-card-meta">
              <span className={`news-card-type is-${kind}`}>{kind === "event" ? "Event" : "Race"}</span>
              <time>{timestamp(item)}</time>
            </div>
            <h4>{item.name || item.title || item.id}</h4>
            <p>{getDescription(item)}</p>
            <a className="news-card-details" href={kind === "race" ? "/dashboard/races" : `#${item.id}`}>
              Details <ChevronRight size={18} strokeWidth={3} aria-hidden="true" />
            </a>
          </div>
        </article>;
      })}
      {!visibleItems.length ? <p className="news-feed-empty">ยังไม่มีรายการตามตัวเลือกนี้</p> : null}
    </div>
  </section>;
}
