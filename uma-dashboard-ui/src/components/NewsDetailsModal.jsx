import { createPortal } from "react-dom";
import { CalendarDays, Flag, MapPin, Trophy, Users, X } from "lucide-react";
import { getNewsDescription, getNewsImage, getNewsKind } from "../utils/newsItems";
import RaceRegistrationPanel from "./RaceRegistrationPanel";
import "../styles/newsPage.css";

function shortDate(item) {
  return `${String(item.date || "").replaceAll("-", "/")} · ${item.time || "--:--"} GMT+7`;
}

function formatFans(value) {
  const fans = Number(value);
  return Number.isFinite(fans) ? `${fans.toLocaleString("th-TH")} fans` : null;
}

function formatSurface(value) {
  const surface = String(value || "").toLowerCase();
  if (surface === "turf") return "Turf";
  if (surface === "dirt") return "Dirt";
  return value || "";
}

function formatDirection(value) {
  const direction = String(value || "").toLowerCase();
  if (direction === "right") return "เลี้ยวขวา";
  if (direction === "left") return "เลี้ยวซ้าย";
  if (direction === "straight") return "ทางตรง";
  return "";
}

export default function NewsDetailsModal({ item, onClose, userId, profileType }) {
  if (!item) return null;
  const isRace = getNewsKind(item) === "race";
  const image = getNewsImage(item);
  const course = item.course || {};
  const venue = course.venue || item.venue;
  const surface = formatSurface(course.surface || item.track);
  const distance = course.distance_m ? `${Number(course.distance_m).toLocaleString("th-TH")} m` : item.distance;
  const direction = formatDirection(course.direction);
  const courseDetails = [surface, distance, direction].filter(Boolean).join(" · ");
  const fansRequired = formatFans(item.requirements?.fans_required ?? item.fans_required);
  const firstPlaceFans = formatFans(item.fans_reward_first);

  const modal = <div className="news-modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="news-detail-modal" role="dialog" aria-modal="true" aria-labelledby="news-detail-title" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="news-modal-close" onClick={onClose} aria-label="ปิดรายละเอียด"><X size={20} /></button>
      {image ? <img className={`news-detail-image${isRace ? " is-race" : ""}`} src={image} alt="" /> : null}
      <div className="news-detail-body">
        <p className={`news-type-label ${isRace ? "race" : "event"}`}>{isRace ? "Race" : "Event"}</p>
        <h2 id="news-detail-title">{item.name}</h2>
        <time><CalendarDays size={16} /> {shortDate(item)}</time>
        <p className="news-detail-summary">{getNewsDescription(item)}</p>
        {isRace ? <div className="news-detail-facts news-race-facts">
          <div className="news-race-fact-wide"><MapPin size={18} /><span><b>ข้อมูลสนาม</b>{[venue, courseDetails].filter(Boolean).join(" · ") || "รายละเอียดสนามกำลังอัปเดต"}</span></div>
          <div><Users size={18} /><span><b>เงื่อนไขแฟน</b>{fansRequired ? `ต้องมีอย่างน้อย ${fansRequired}` : "ไม่มีเงื่อนไขแฟนใน Career"}</span></div>
          <div><Trophy size={18} /><span><b>รางวัลอันดับ 1</b>{firstPlaceFans ? `${firstPlaceFans} เมื่อชนะ` : "ไม่มีข้อมูลรางวัลแฟน"}</span></div>
        </div> : <div className="news-detail-facts">
          <div><Flag size={18} /><span><b>เกี่ยวกับ Event นี้</b>{item.details || "อ่านประกาศกิจกรรม แล้วเข้าร่วมตามเวลาที่กำหนด"}</span></div>
          <div><Users size={18} /><span><b>จำนวนผู้เข้าร่วม</b>{item.capacity || "ไม่จำกัดจำนวน (หากมีการเปลี่ยนแปลงจะแจ้งในประกาศ)"}</span></div>
        </div>}
        {isRace && userId ? <RaceRegistrationPanel event={item} userId={userId} profileType={profileType} /> : null}
      </div>
    </section>
  </div>;

  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}
