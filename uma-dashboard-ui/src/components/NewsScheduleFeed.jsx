import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BOT_API_BASE } from "../api/playerApi";
import NewsListingCard from "./NewsListingCard";
import "../styles/newsScheduleFeed.css";

function getDate(item) {
  const value = item.date && item.time ? `${item.date}T${item.time}` : item.date;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export default function NewsScheduleFeed({ onViewAll, onItemSelected }) {
  const [items, setItems] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/news`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const ordered = [...(Array.isArray(data) ? data : [])].sort((left, right) => (
          (getDate(left)?.getTime() || Number.MAX_SAFE_INTEGER)
          - (getDate(right)?.getTime() || Number.MAX_SAFE_INTEGER)
        ));
        setItems(ordered);
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const updateScrollButtons = () => {
      setCanScrollLeft(list.scrollLeft > 2);
      setCanScrollRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 2);
    };
    updateScrollButtons();
    list.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      list.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [items]);

  const moveEvents = (direction) => {
    const list = listRef.current;
    if (!list) return;
    list.scrollBy({ left: direction * Math.max(list.clientWidth * 0.8, 260), behavior: "smooth" });
  };

  return <section className="news-schedule-feed" aria-labelledby="news-schedule-title">
    <header className="news-schedule-header">
      <div><p>ตารางเวลาอีเว้น</p><h3 id="news-schedule-title">Events</h3></div>
      <button type="button" className="news-view-all" onClick={onViewAll}>ดู Event ทั้งหมด</button>
    </header>

    <div className="news-events-carousel">
      {canScrollLeft && <button type="button" className="news-scroll-arrow is-left" aria-label="เลื่อน event ไปทางซ้าย" onClick={() => moveEvents(-1)}><ChevronLeft size={22} /></button>}
      <div className="news-card-list" ref={listRef}>
        {items.map((item) => <NewsListingCard key={`${item.id}-${item.date}-${item.time}`} item={item} compact onDetails={onItemSelected} />)}
        {!items.length ? <p className="news-feed-empty">ยังไม่มีรายการ event</p> : null}
      </div>
      {canScrollRight && <button type="button" className="news-scroll-arrow is-right" aria-label="เลื่อน event ไปทางขวา" onClick={() => moveEvents(1)}><ChevronRight size={22} /></button>}
    </div>
  </section>;
}
