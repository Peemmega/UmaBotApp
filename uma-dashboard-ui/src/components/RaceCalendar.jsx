import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Flag, Radio } from "lucide-react";
import "../styles/raceCalendar.css";
import { BOT_API_BASE } from "../api/playerApi";

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
  return new Intl.DateTimeFormat("th-TH", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function eventMeta(event) {
  return [event.venue, event.track, event.distance].filter(Boolean).join(" · ");
}

export default function RaceCalendar() {
  const [events, setEvents] = useState([]);

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

  const schedule = useMemo(() => {
    return events.slice(0, 3);
  }, [events]);

  const featuredEvent = schedule[0];

  return (
    <section className="race-desk" aria-labelledby="race-desk-title">
      <header className="race-desk-header">
        <span className="race-desk-icon" aria-hidden="true"><Radio size={17} /></span>
        <div>
          <p>Race desk</p>
          <h3 id="race-desk-title">ตารางแข่ง</h3>
        </div>
      </header>

      {featuredEvent ? (
        <article className="race-desk-featured">
          <div className="race-desk-featured-label"><Flag size={15} /> สนามถัดไป</div>
          <strong>{featuredEvent.name || featuredEvent.id}</strong>
          <span>{eventMeta(featuredEvent) || "รายละเอียดสนามกำลังอัปเดต"}</span>
          <time>{formatEventDate(featuredEvent)}</time>
        </article>
      ) : (
        <div className="race-desk-empty">
          <CalendarDays size={20} aria-hidden="true" />
          <span>ยังไม่มีรายการแข่งที่กำหนดไว้</span>
        </div>
      )}

      {schedule.length > 1 ? (
        <ol className="race-desk-list">
          {schedule.slice(1).map((event) => (
            <li key={`${event.id}-${event.date}-${event.time}`}>
              <time>{formatEventDate(event)}</time>
              <span><strong>{event.name || event.id}</strong><small>{eventMeta(event)}</small></span>
            </li>
          ))}
        </ol>
      ) : null}

      <a className="race-desk-link" href="/dashboard/races">
        ดูรายการแข่งทั้งหมด <ChevronRight size={16} aria-hidden="true" />
      </a>
    </section>
  );
}
