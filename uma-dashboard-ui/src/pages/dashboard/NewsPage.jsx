import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CirclePlus, Flag, Trophy, Users, X } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import { GameCard, SectionHeader } from "../../components/ui";
import NewsListingCard from "../../components/NewsListingCard";
import { getNewsDescription, getNewsImage, getNewsKind } from "../../utils/newsItems";
import "../../styles/newsPage.css";

const BANNERS = [
  "/eventBanners/newyear_converted.webp", "/eventBanners/sweet_converted.webp",
  "/eventBanners/WhiteDay_converted.webp", "/eventBanners/dance_converted.webp", "/eventBanners/camping_converted.webp",
  "/eventBanners/ChildrensDay_converted.webp", "/eventBanners/summer_converted.webp", "/eventBanners/waterPark_converted.webp",
  "/eventBanners/summercamp_converted.webp", "/eventBanners/specialEvent_converted.webp", "/eventBanners/destructionEvent_converted.webp",
  "/eventBanners/halloween_converted.webp", "/eventBanners/hollywood_converted.webp", "/eventBanners/christmas_converted.webp",
];

const EMPTY_EVENT = {
  name: "", date: "", time: "19:00", image_url: "", description: "", details: "", capacity: "",
};

function shortDate(item) {
  return `${String(item.date || "").replaceAll("-", "/")} · ${item.time || "--:--"} GMT+7`;
}

function monthLabel(key) {
  const [year, month] = key.split("-");
  return new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" })
    .format(new Date(Number(year), Number(month) - 1, 1));
}

function DetailsModal({ item, onClose }) {
  if (!item) return null;
  const isRace = getNewsKind(item) === "race";
  const image = getNewsImage(item);
  const conditions = [item.venue, item.track, item.distance].filter(Boolean).join(" · ");

  return <div className="news-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="news-detail-modal" role="dialog" aria-modal="true" aria-labelledby="news-detail-title" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="news-modal-close" onClick={onClose} aria-label="ปิดรายละเอียด"><X size={20} /></button>
      {image ? <img className="news-detail-image" src={image} alt="" /> : null}
      <div className="news-detail-body">
        <p className={`news-type-label ${isRace ? "race" : "event"}`}>{isRace ? "Race" : "Event"}</p>
        <h2 id="news-detail-title">{item.name}</h2>
        <time><CalendarDays size={16} /> {shortDate(item)}</time>
        <p className="news-detail-summary">{getNewsDescription(item)}</p>
        {isRace ? <div className="news-detail-facts">
          <div><Trophy size={18} /><span><b>เงื่อนไขการแข่งขัน</b>{conditions || "รายละเอียดสนามกำลังอัปเดต"}</span></div>
          <div><Users size={18} /><span><b>จำนวนผู้เข้าแข่ง</b>{item.capacity || "ตามจำนวนที่ห้องแข่งรองรับ"}</span></div>
        </div> : <div className="news-detail-facts">
          <div><Flag size={18} /><span><b>เกี่ยวกับ Event นี้</b>{item.details || "อ่านประกาศกิจกรรม แล้วเข้าร่วมตามเวลาที่กำหนด"}</span></div>
          <div><Users size={18} /><span><b>จำนวนผู้เข้าร่วม</b>{item.capacity || "ไม่จำกัดจำนวน (หากมีการเปลี่ยนแปลงจะแจ้งในประกาศ)"}</span></div>
        </div>}
      </div>
    </section>
  </div>;
}

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_EVENT);
  const [saveState, setSaveState] = useState("");

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
  const activeMonth = selectedMonth || months[0] || "";
  const visibleItems = ordered.filter((item) => String(item.date || "").startsWith(activeMonth));

  const saveEvent = async (event) => {
    event.preventDefault();
    setSaveState("saving");
    try {
      const response = await fetch(`${BOT_API_BASE}/news/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.detail || "ไม่สามารถบันทึก Event ได้");
      setItems((current) => [...current, saved]);
      setSelectedMonth(saved.date.slice(0, 7));
      setDraft(EMPTY_EVENT);
      setIsEditorOpen(false);
      setSaveState("");
    } catch (error) {
      setSaveState(error.message || "ไม่สามารถบันทึก Event ได้");
    }
  };

  return <main className="news-page" aria-label="News">
    <GameCard as="header" className="news-page-header-card">
      <SectionHeader
        kicker="Community board"
        title="News"
        titleClassName="news-page-title"
        action={<button type="button" className="news-create-button" onClick={() => setIsEditorOpen((open) => !open)}><CirclePlus size={19} /> เพิ่ม Event</button>}
      />
      <p className="news-page-description">กำหนดการ Event และการแข่งขันทั้งหมด เรียงตามวันเวลา GMT+7</p>
    </GameCard>

    {isEditorOpen ? <form className="news-event-editor" onSubmit={saveEvent}>
      <div className="news-editor-heading"><div><h2>เพิ่ม Event ใหม่</h2><p>ข้อมูลนี้จะแยกเก็บจากรายการแข่ง และแสดงใน News ตามวันเวลา</p></div><button type="button" onClick={() => setIsEditorOpen(false)} aria-label="ปิดฟอร์ม"><X size={18} /></button></div>
      <div className="news-editor-grid">
        <label>ชื่อ Event<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>วันเริ่ม<input required type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
        <label>เวลา (GMT+7)<input required type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
        <label>จำนวนผู้เข้าร่วม<input placeholder="เช่น 12 คน / ไม่จำกัด" value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: event.target.value })} /></label>
        <label className="news-editor-wide">ข้อความเกริ่น<textarea rows="2" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
        <label className="news-editor-wide">รายละเอียด / วิธีเข้าร่วม<textarea rows="3" value={draft.details} onChange={(event) => setDraft({ ...draft, details: event.target.value })} /></label>
        <label className="news-editor-wide">ภาพ Banner<select value={draft.image_url} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })}><option value="">ไม่ใช้ภาพ</option>{BANNERS.map((src) => <option key={src} value={src}>{src.split("/").pop()}</option>)}</select></label>
      </div>
      {saveState && saveState !== "saving" ? <p className="news-editor-error">{saveState}</p> : null}
      <div className="news-editor-actions"><button type="button" onClick={() => setIsEditorOpen(false)}>ยกเลิก</button><button type="submit" disabled={saveState === "saving"}>{saveState === "saving" ? "กำลังบันทึก…" : "บันทึก Event"}</button></div>
    </form> : null}

    <nav className="news-month-tabs" aria-label="เลือกเดือน">{months.map((month) => <button type="button" key={month} className={activeMonth === month ? "is-active" : ""} onClick={() => setSelectedMonth(month)}>{monthLabel(month)}</button>)}</nav>

    <section className="news-month-section" aria-label={activeMonth ? monthLabel(activeMonth) : "News"}>
      <div className="news-month-title"><CalendarDays size={22} /><h2>{activeMonth ? monthLabel(activeMonth) : "ยังไม่มีรายการ"}</h2><span>{visibleItems.length} รายการ</span></div>
      <div className="news-page-list">
        {visibleItems.map((item) => <NewsListingCard key={`${item.id}-${item.date}-${item.time}`} item={item} onDetails={setSelectedItem} />)}
        {!visibleItems.length ? <p className="news-empty">ยังไม่มี Event หรือการแข่งขันในเดือนนี้</p> : null}
      </div>
    </section>
    <DetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} />
  </main>;
}
