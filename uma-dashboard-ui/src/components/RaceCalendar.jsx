import React, { useEffect, useMemo, useState } from "react";
import "../styles/raceCalendar.css";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function RaceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const res = await fetch(`${BOT_API_BASE}/race/calendar`);
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCalendar();
  }, []);

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const result = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let day = 1; day <= lastDate; day++) result.push(day);

    return result;
  }, [year, month]);

  const eventsThisMonth = events.filter((event) => {
    const d = new Date(event.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const getEventByDay = (day) => {
    if (!day) return null;

    return eventsThisMonth.find((event) => {
      const d = new Date(event.date);
      return d.getDate() === day;
    });
  };

  const changeMonth = (amount) => {
    setCurrentDate(new Date(year, month + amount, 1));
  };

  return (
    <aside className="race-calendar-side">
      <section className="race-calendar-card">
        <div className="race-calendar-header">
          <button onClick={() => changeMonth(-1)}>‹</button>
          <h3>{monthNames[month]}</h3>
          <button onClick={() => changeMonth(1)}>›</button>
        </div>

        <div className="race-weekdays">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        <div className="race-days">
          {days.map((day, index) => {
            const event = getEventByDay(day);

            return (
              <div
                key={index}
                className={`race-day ${day ? "" : "empty"} ${event ? "has-event" : ""}`}
              >
                {event && <span className="race-day-icon">🏇</span>}
                <span>{day}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="race-list-title">รายการแข่ง</div>

      <section className="race-list">
        {eventsThisMonth.length === 0 ? (
          <div className="race-empty">ยังไม่มีรายการแข่งเดือนนี้</div>
        ) : (
          eventsThisMonth.map((event) => (
            <div className="race-item" key={`${event.id}-${event.date}`}>
              <img src={event.thumbnail || event.image} alt={event.name} />

              <div className="race-info">
                <h4>{event.name}</h4>
                <p>{event.track} / {event.distance}</p>
                <span>
                  {new Date(event.date).getDate()}/{month + 1}/{year} {event.time}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </aside>
  );
}