import { createPortal } from "react-dom";
import { CalendarDays, Flag, Trophy, Users, X } from "lucide-react";
import { getNewsDescription, getNewsImage, getNewsKind } from "../utils/newsItems";
import "../styles/newsPage.css";

function shortDate(item) {
  return `${String(item.date || "").replaceAll("-", "/")} · ${item.time || "--:--"} GMT+7`;
}

export default function NewsDetailsModal({ item, onClose }) {
  if (!item) return null;
  const isRace = getNewsKind(item) === "race";
  const image = getNewsImage(item);
  const conditions = [item.venue, item.track, item.distance].filter(Boolean).join(" · ");

  const modal = <div className="news-modal-backdrop" role="presentation" onMouseDown={onClose}>
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

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}
