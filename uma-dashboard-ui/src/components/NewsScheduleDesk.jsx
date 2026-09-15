import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Flag,
  Newspaper,
  SlidersHorizontal,
  Trophy,
  X,
} from "lucide-react";
import "../styles/newsScheduleDesk.css";
import { BOT_API_BASE } from "../api/playerApi";
import { getRaceImage } from "../utils/raceSchedule";

const DISPLAY_OPTIONS = [3, 5, 8];
const FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "event", label: "กิจกรรม" },
  { value: "race", label: "การแข่งขัน" },
];
const SETTINGS_KEY = "uma-schedule-desk-settings";

function getEventDate(event) {
  const raw = event.start_at || event.starts_at || event.datetime || (
    event.date && event.time ? `${event.date}T${event.time}` : event.date
  );
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function formatEventDate(event) {
  const date = getEventDate(event);
  if (!date) return event.time || "กำหนดการเร็ว ๆ นี้";

  const shortDate = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date);
  const weekday = new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(date);
  const time = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);

  return `${shortDate} (${weekday}) · ${time}`;
}

function formatDateTile(event) {
  const date = getEventDate(event);
  if (!date) return { day: "—", month: "TBA" };
  return {
    day: new Intl.DateTimeFormat("th-TH-u-nu-latn", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("th-TH", { month: "short" }).format(date).replace(".", ""),
  };
}

function eventMeta(event) {
  return [event.venue, event.track, event.distance].filter(Boolean).join(" · ");
}

function eventKind(event) {
  return String(event.kind || event.type || "race").toLowerCase() === "event" ? "event" : "race";
}

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      filter: FILTERS.some((item) => item.value === stored.filter) ? stored.filter : "all",
      limit: DISPLAY_OPTIONS.includes(stored.limit) ? stored.limit : DISPLAY_OPTIONS[0],
    };
  } catch {
    return { filter: "all", limit: DISPLAY_OPTIONS[0] };
  }
}

function ScheduleImage({ event, className = "" }) {
  const kind = eventKind(event);
  const image = kind === "race"
    ? getRaceImage(event)
    : event.image_url || event.thumbnail || event.image;

  if (!image) {
    return <span className={`schedule-image-fallback ${className}`} aria-hidden="true">
      {kind === "event" ? <CalendarDays size={22} /> : <Trophy size={22} />}
    </span>;
  }

  return <img className={className} src={image} alt="" loading="lazy" />;
}

export default function NewsScheduleDesk() {
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/race/calendar`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const sorted = [...(Array.isArray(data) ? data : [])].sort((left, right) => (
          (getEventDate(left)?.getTime() || Number.MAX_SAFE_INTEGER)
          - (getEventDate(right)?.getTime() || Number.MAX_SAFE_INTEGER)
        ));
        const now = Date.now();
        const upcoming = sorted.filter((event) => (getEventDate(event)?.getTime() || 0) >= now);
        setEvents(upcoming.length ? upcoming : sorted);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const schedule = useMemo(() => events
    .filter((event) => settings.filter === "all" || eventKind(event) === settings.filter)
    .slice(0, settings.limit), [events, settings]);
  const featuredEvent = schedule[0];

  return (
    <section className="schedule-desk" aria-labelledby="schedule-desk-title">
      <header className="schedule-desk-header">
        <span className="schedule-desk-icon" aria-hidden="true"><Newspaper size={17} /></span>
        <div>
          <p>News & schedule</p>
          <h3 id="schedule-desk-title">ข่าวและกำหนดการ</h3>
        </div>
        <button
          type="button"
          className="schedule-manager-button"
          aria-label="จัดการการแสดงกำหนดการ"
          aria-expanded={isManagerOpen}
          onClick={() => setIsManagerOpen((open) => !open)}
        >
          {isManagerOpen ? <X size={17} /> : <SlidersHorizontal size={17} />}
        </button>
      </header>

      {isManagerOpen ? (
        <div className="schedule-manager" aria-label="ตั้งค่าการแสดงกำหนดการ">
          <span>แสดง</span>
          <div className="schedule-filter-row" role="group" aria-label="ประเภทกำหนดการ">
            {FILTERS.map((filter) => <button
              type="button"
              key={filter.value}
              className={settings.filter === filter.value ? "is-active" : ""}
              onClick={() => setSettings((current) => ({ ...current, filter: filter.value }))}
            >
              {filter.label}
            </button>)}
          </div>
          <label className="schedule-limit-select">
            <span>จำนวนรายการ</span>
            <select
              value={settings.limit}
              onChange={(event) => setSettings((current) => ({ ...current, limit: Number(event.target.value) }))}
            >
              {DISPLAY_OPTIONS.map((option) => <option key={option} value={option}>{option} รายการ</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {featuredEvent ? (
        <article className="schedule-lead">
          <DateTile event={featuredEvent} className="schedule-date-tile" />
          <ScheduleImage event={featuredEvent} className="schedule-lead-image" />
          <div className="schedule-lead-copy">
            <KindLabel event={featuredEvent} withIcon />
            <strong>{featuredEvent.name || featuredEvent.title || featuredEvent.id}</strong>
            <p>{featuredEvent.description || eventMeta(featuredEvent) || "รายละเอียดกำลังอัปเดต"}</p>
            <time>{formatEventDate(featuredEvent)}</time>
          </div>
        </article>
      ) : (
        <div className="schedule-desk-empty">
          <CalendarDays size={20} aria-hidden="true" />
          <span>ยังไม่มีรายการตามตัวเลือกนี้</span>
        </div>
      )}

      {schedule.length > 1 ? (
        <ol className="schedule-feed">
          {schedule.slice(1).map((event) => <li key={`${event.id || event.title}-${event.date}-${event.time}`}>
            <DateTile event={event} className="schedule-feed-date" />
            <ScheduleImage event={event} className="schedule-feed-image" />
            <div>
              <KindLabel event={event} />
              <strong>{event.name || event.title || event.id}</strong>
              <time>{formatEventDate(event)}</time>
            </div>
          </li>)}
        </ol>
      ) : null}

      <a className="schedule-desk-link" href="/dashboard/races">
        ดูรายการแข่งทั้งหมด <ChevronRight size={16} aria-hidden="true" />
      </a>
    </section>
  );
}

function DateTile({ event, className }) {
  const date = formatDateTile(event);
  return <div className={className} aria-label={formatEventDate(event)}>
    <strong>{date.day}</strong><span>{date.month}</span>
  </div>;
}

function KindLabel({ event, withIcon = false }) {
  const kind = eventKind(event);
  return <span className={`schedule-kind is-${kind}`}>
    {withIcon ? (kind === "event" ? <CalendarDays size={12} /> : <Flag size={12} />) : null}
    {kind === "event" ? "กิจกรรม" : "การแข่งขัน"}
  </span>;
}
