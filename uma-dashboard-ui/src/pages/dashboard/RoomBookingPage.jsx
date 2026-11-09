import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, CalendarClock, Check, ChevronRight, Clock3, DoorOpen, LockKeyhole, Plus, RefreshCw, Users } from "lucide-react";
import { createRoomBooking, getRoomBookingOptions, joinRoomBooking, listRoomBookings } from "../../api/roomBookingApi";
import { getSkillIcon } from "../../utils/getSkillIcon";
import { getGradeImage } from "../../utils/grade";
import { toAbsoluteBotUrl } from "../../utils/avatar";
import { describeRaceEffect } from "../../utils/raceEffects";
import staminaIcon from "../../assets/icons/Stamina.webp";
import speedIcon from "../../assets/icons/Speed.webp";
import powerIcon from "../../assets/icons/Power.webp";
import gutIcon from "../../assets/icons/Gut.webp";
import witIcon from "../../assets/icons/Wit.webp";
import "../../styles/roomBookingPage.css";

const TYPE_LABELS = { practice: "ห้องฝึกซ้อม", legend: "Legend Race", debut: "Debut" };
const WEATHER_LABELS = { none: "ไม่มี", random: "สุ่ม", sunny: "แดดจัด", rainy: "ฝนตก" };
const LEGEND_STAT_LABELS = { speed: "ความเร็ว", stamina: "ความอึด", power: "พลัง", gut: "ความมุ่งมั่น", wit: "ไหวพริบ" };
const LEGEND_STAT_ICONS = { speed: speedIcon, stamina: staminaIcon, power: powerIcon, gut: gutIcon, wit: witIcon };
const APTITUDE_LABELS = { turf: "สนามหญ้า", dirt: "สนามดิน", sprint: "Sprint", mile: "Mile", medium: "Medium", long: "Long", front: "Front", pace: "Pace", late: "Late", end_style: "End" };
const STAMINA_EMOJI_PATTERN = /(<a?:Stamina:\d+>)/g;

function renderSkillText(text) {
  if (!text) return null;
  return String(text).split(STAMINA_EMOJI_PATTERN).map((part, index) => /^<a?:Stamina:\d+>$/.test(part)
    ? <img key={index} src={staminaIcon} alt="Stamina" className="skill-loadout-inline-icon" />
    : part);
}
const THAI_DATE = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });
const THAI_TIME = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });

function getThaiDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function makeDefaultTime() {
  const now = new Date();
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(now));
  const minute = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Bangkok", minute: "2-digit" }).format(now));
  const nextMinute = Math.ceil((minute + 1) / 30) * 30;
  const normalizedHour = hour + Math.floor(nextMinute / 60);
  if (normalizedHour >= 24) return { date: getThaiDate(new Date(now.getTime() + 86400000)), time: "10:00" };
  return { date: getThaiDate(), time: `${String(Math.max(10, normalizedHour)).padStart(2, "0")}:${String(nextMinute % 60).padStart(2, "0")}` };
}

function localDateTime(value) {
  const date = new Date(value);
  return { date: THAI_DATE.format(date), time: THAI_TIME.format(date) };
}

function RoomCard({ room, accountRole, userId, onJoin, busyId }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const time = localDateTime(room.starts_at);
  const members = room.members || [];
  const isMember = members.some((member) => String(member.user_id) === String(userId));
  const canJoin = accountRole === "trainee" && !isMember && room.status !== "failed" && (
    room.booking_type !== "practice" || room.visibility === "public"
  );
  const threadUrl = room.thread_id && room.guild_id ? `https://discord.com/channels/${room.guild_id}/${room.thread_id}` : "";

  return (
    <article className={`booking-room-card booking-room-${room.booking_type}`}>
      <div className="booking-room-time">
        <span>{time.time}</span>
        <small>{time.date}</small>
      </div>
      <div className="booking-room-main">
        <div className="booking-room-heading">
          <span className={`booking-type-mark booking-type-${room.booking_type}`}>{TYPE_LABELS[room.booking_type]}</span>
          {room.visibility === "private" && <span className="booking-private-mark"><LockKeyhole size={13} /> Private</span>}
          {room.status === "open" && <span className="booking-live-mark"><i /> เปิดห้องแล้ว</span>}
          {room.status === "creating" && <span className="booking-creating-mark">กำลังสร้างห้อง</span>}
          {room.status === "failed" && <span className="booking-failed-mark">กำลังลองเปิดห้องอีกครั้ง</span>}
        </div>
        <h3>{room.stage_name || room.stage_key}</h3>
        <p className="booking-room-by">โดย {room.creator_name} <span>·</span> {members.length} คนลงชื่อ</p>
      </div>
      <div className="booking-room-actions">
        <button className="booking-quiet-button" type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
          รายละเอียด <ChevronRight size={16} className={detailsOpen ? "is-rotated" : ""} />
        </button>
        {canJoin && (
          <button className="booking-join-button" type="button" onClick={() => onJoin(room)} disabled={busyId === room.booking_id}>
            {busyId === room.booking_id ? "กำลังลงชื่อ..." : "ลงชื่อเข้าร่วม"}
          </button>
        )}
        {isMember && <span className="booking-joined"><Check size={15} /> ลงชื่อแล้ว</span>}
      </div>
      {detailsOpen && (
        <div className="booking-room-details">
          <div><strong>สนาม</strong><span>{room.stage_name || room.stage_key}</span></div>
          <div><strong>ผู้สร้าง</strong><span>{room.creator_name}</span></div>
          <div><strong>ประเภท</strong><span>{TYPE_LABELS[room.booking_type]}{room.visibility === "public" ? " · free-join" : " · private"}</span></div>
          {room.settings?.weather && <div><strong>อากาศ</strong><span>{WEATHER_LABELS[room.settings.weather] || room.settings.weather}</span></div>}
          {room.settings?.legend_key && <div><strong>Legend</strong><span>{room.legend_name || room.settings.legend_key} · Lv.{room.settings.legend_level || 1}</span></div>}
          {room.settings?.mob_level && <div><strong>Mob</strong><span>{room.settings.mob_count || room.settings.mobs?.length || 8} ตัว · Lv.{room.settings.mob_level}</span></div>}
          {!room.settings?.mob_level && room.settings?.mobs?.length > 0 && <div><strong>Mob</strong><span>{room.settings.mobs.map((mob) => `${mob.name || mob.key} Lv.${mob.level || 1}`).join("、")}</span></div>}
          {room.status === "failed" && <div className="booking-room-open-error"><strong>สถานะเปิดห้อง</strong><span>{String(room.creator_id) === String(userId) && room.error ? room.error : "กำลังลองเปิดห้องอีกครั้ง"}</span></div>}
          <div className="booking-attendee-list"><strong>สมาชิก</strong><span>{members.map((member) => member.username).join("、") || "ยังไม่มีสมาชิก"}</span></div>
          {threadUrl && <a href={threadUrl} target="_blank" rel="noreferrer">เปิดเธรดใน Discord <ChevronRight size={15} /></a>}
        </div>
      )}
    </article>
  );
}

function CreateBooking({ userId, accountRole, onBack, onCreated }) {
  const defaults = useMemo(makeDefaultTime, []);
  const [options, setOptions] = useState(null);
  const [type, setType] = useState(accountRole === "trainee" ? "legend" : "practice");
  const [stageKey, setStageKey] = useState("");
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [atMidnight, setAtMidnight] = useState(defaults.time === "24:00");
  const [visibility, setVisibility] = useState("public");
  const [invitedIds, setInvitedIds] = useState([]);
  const [weather, setWeather] = useState("none");
  const [mobs, setMobs] = useState([]);
  const [legendKey, setLegendKey] = useState("");
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getRoomBookingOptions().then((data) => {
      setOptions(data);
      setStageKey(data.stages?.find((stage) => stage.key === "Debut" || stage.name?.toLowerCase() === "debut")?.key || data.stages?.[0]?.key || "");
      setLegendKey(data.legend_presets?.[0]?.key || "");
    }).catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!selectedSkill) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedSkill(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedSkill]);

  const debutStageKey = options?.stages?.find((stage) => stage.key === "Debut" || stage.name?.toLowerCase() === "debut")?.key || stageKey;
  const selectedLegendPreset = options?.legend_presets?.find((preset) => preset.key === legendKey);
  const selectedStageKey = type === "debut" ? debutStageKey : type === "legend" ? selectedLegendPreset?.stage_key || stageKey : stageKey;
  const stageName = options?.stages?.find((stage) => stage.key === selectedStageKey)?.name || "";
  const guestOptions = options?.players || [];

  const addMob = () => {
    if (mobs.length < 8) setMobs((current) => [...current, { key: "rookie_pace", level: 1 }]);
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const settings = type === "practice"
        ? { weather, mobs }
        : type === "legend"
          ? { legend_preset_key: legendKey }
          : {};
      await createRoomBooking({
        user_id: String(userId), booking_type: type, stage_key: selectedStageKey,
        date, time: atMidnight ? "24:00" : time, visibility: type === "practice" ? visibility : "public",
        invited_ids: type === "practice" ? invitedIds : [], settings,
      });
      onCreated();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!options && !error) return <div className="booking-loading">กำลังโหลดข้อมูลสนามและสมาชิก…</div>;

  return (
    <section className="booking-create-view" aria-labelledby="booking-create-title">
      <button type="button" className="booking-back-button" onClick={onBack}><ArrowLeft size={17} /> กลับไปหน้าห้อง</button>
      <div className="booking-create-heading">
        <span className="booking-create-icon"><CalendarClock size={23} /></span>
        <div><span className="booking-eyebrow">กำหนดการแข่งขัน</span><h2 id="booking-create-title">สร้างห้องใหม่</h2><p>เลือกสนามและเวลาตามเวลาไทย ห้องจะเปิดใน Discord อัตโนมัติ</p></div>
      </div>

      <form className="booking-form" onSubmit={submit}>
        <fieldset className="booking-type-choices">
          <legend>ประเภทห้อง</legend>
          {(accountRole === "trainee" ? [["legend", TYPE_LABELS.legend]] : Object.entries(TYPE_LABELS)).map(([value, label]) => (
            <label key={value} className={type === value ? "is-selected" : ""}>
              <input type="radio" name="booking-type" value={value} checked={type === value} onChange={() => setType(value)} />
              <span><strong>{label}</strong><small>{value === "practice" ? "Trainer ตั้งค่าได้เอง" : value === "legend" ? "ท้าทาย Legend ตาม preset" : "สนาม Debut ทางการ"}</small></span>
            </label>
          ))}
        </fieldset>

        <div className="booking-form-grid">
          <label className="booking-field">
            <span>สนาม</span>
            <select value={selectedStageKey} onChange={(event) => setStageKey(event.target.value)} disabled={type !== "practice"} required>
              {(options?.stages || []).map((stage) => <option key={stage.key} value={stage.key}>{stage.name}</option>)}
            </select>
            {type === "debut" && <small>Debut ถูกล็อกเป็นสนาม Debut</small>}
            {type === "legend" && <small>สนามกำหนดจาก Legend preset ในไฟล์ preset</small>}
          </label>
          <label className="booking-field"><span>วันที่</span><input type="date" value={date} min={getThaiDate()} max={getThaiDate(new Date(Date.now() + 7 * 86400000))} onChange={(event) => setDate(event.target.value)} required /></label>
          <label className="booking-field"><span>เวลา (ประเทศไทย)</span><input type="time" min="10:00" max="23:59" step="60" value={time} disabled={atMidnight} onChange={(event) => { setAtMidnight(false); setTime(event.target.value); }} required={!atMidnight} /><span className="booking-midnight-option"><input type="checkbox" checked={atMidnight} onChange={(event) => setAtMidnight(event.target.checked)} /> ระบุเป็น 24:00 น.</span></label>
          <div className="booking-time-note"><Clock3 size={15} /> เวลาให้เลือกตั้งแต่ 10:00 ถึง 24:00 น.</div>
        </div>

        {type === "practice" && <>
          <div className="booking-form-section">
            <div className="booking-section-heading"><div><h3>รูปแบบห้อง</h3><p>กำหนดว่าใครเข้าห้องได้</p></div></div>
            <div className="booking-visibility-switch">
              <button type="button" className={visibility === "public" ? "is-active" : ""} onClick={() => setVisibility("public")}><DoorOpen size={17} /><span><strong>Free-join</strong><small>ทุกคนเข้าร่วมได้</small></span></button>
              <button type="button" className={visibility === "private" ? "is-active" : ""} onClick={() => setVisibility("private")}><LockKeyhole size={17} /><span><strong>Private</strong><small>ผู้สร้างและสมาชิกที่เลือก</small></span></button>
            </div>
            <label className="booking-field booking-member-picker"><span><Users size={15} /> เพิ่มสมาชิก (เลือกได้หลายคน)</span><select multiple value={invitedIds} onChange={(event) => setInvitedIds(Array.from(event.target.selectedOptions, (option) => option.value))}>{guestOptions.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><small>สมาชิกที่เลือกจะได้รับ ping และเข้าร่วมในเธรดที่สร้าง</small></label>
          </div>
          <div className="booking-form-section">
            <div className="booking-section-heading"><div><h3>การตั้งค่าการแข่ง</h3><p>ปรับได้ก่อนห้องเปิด</p></div></div>
            <label className="booking-field booking-weather-field"><span>สภาพอากาศ</span><select value={weather} onChange={(event) => setWeather(event.target.value)}>{Object.entries(WEATHER_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <div className="booking-mob-list">
              {mobs.map((mob, index) => <div className="booking-mob-row" key={`mob-${index}`}>
                <label className="booking-field"><span>Mob {index + 1}</span><select value={mob.key} onChange={(event) => setMobs((current) => current.map((item, i) => i === index ? { ...item, key: event.target.value } : item))}>{(options?.mobs || []).map((option) => <option key={option.key} value={option.key}>{option.name}</option>)}</select></label>
                <label className="booking-field"><span>ระดับ</span><select value={mob.level} onChange={(event) => setMobs((current) => current.map((item, i) => i === index ? { ...item, level: Number(event.target.value) } : item))}>{Array.from({ length: 8 }, (_, i) => i + 1).map((level) => <option key={level} value={level}>Lv.{level}</option>)}</select></label>
                <button type="button" className="booking-remove-mob" onClick={() => setMobs((current) => current.filter((_, i) => i !== index))} aria-label={`ลบ Mob ${index + 1}`}>×</button>
              </div>)}
              <button type="button" className="booking-add-mob" onClick={addMob} disabled={mobs.length >= 8}><Plus size={16} /> เพิ่ม Mob <span>{mobs.length}/8</span></button>
            </div>
          </div>
        </>}

        {type === "legend" && <div className="booking-form-section">
          <div className="booking-section-heading"><div><h3>Legend Race preset</h3><p>ค่าการแข่งกำหนดไว้ในไฟล์ preset ของบอต</p></div></div>
          <label className="booking-field"><span>เลือก Legend</span><select value={legendKey} onChange={(event) => setLegendKey(event.target.value)}>{(options?.legend_presets || []).map((preset) => <option key={preset.key} value={preset.key}>{preset.name}</option>)}</select></label>
          {selectedLegendPreset && <div className="booking-legend-preset-summary">
            <div className="booking-legend-profile">
              <img className="booking-legend-portrait" src={toAbsoluteBotUrl(selectedLegendPreset.image_url)} alt={selectedLegendPreset.name} />
              <div className="booking-legend-identity"><span>LEGEND RACER</span><strong>{selectedLegendPreset.name}</strong><small>{selectedLegendPreset.style} style · Lv.{selectedLegendPreset.legend_level}</small><small>{selectedLegendPreset.stage_name}</small></div>
            </div>
            <div className="booking-legend-details">
              <section className="booking-legend-info-section"><h4>Stats</h4><div className="booking-legend-stats">{Object.entries(selectedLegendPreset.stats || {}).map(([key, value]) => <div key={key} title={LEGEND_STAT_LABELS[key] || key} aria-label={`${LEGEND_STAT_LABELS[key] || key}: ${value}`}><img src={LEGEND_STAT_ICONS[key]} alt={LEGEND_STAT_LABELS[key] || key} /><strong>{value}</strong></div>)}</div></section>
              <section className="booking-legend-info-section"><h4>Aptitude ในสนามนี้</h4><div className="booking-legend-aptitudes">{(selectedLegendPreset.aptitudes || []).map((aptitude) => <div key={aptitude.key}><span>{APTITUDE_LABELS[aptitude.label] || aptitude.label}</span><img src={getGradeImage(aptitude.rank)} alt={`Rank ${aptitude.rank}`} /><small>{aptitude.rank}</small></div>)}</div></section>
              <section className="booking-legend-info-section booking-legend-skills-section"><h4>Skills ทั้งหมด</h4><div className="booking-legend-skills skill-loadout-list">{(selectedLegendPreset.skills || []).map((skill, index) => <button className="skill-loadout-item skill-loadout-item-button" type="button" key={skill.id} onClick={() => setSelectedSkill(skill)}><span className="skill-loadout-slot">{index + 1}</span><span className="skill-icon-box">{getSkillIcon(skill.icon)}</span><span className="skill-loadout-name">{skill.name}</span><span className="skill-loadout-cd">{skill.cost ?? 0}</span></button>)}</div></section>
            </div>
            <div className="booking-legend-preset-meta"><span><strong>Mob</strong>{selectedLegendPreset.mob_count || 8} ตัว · Lv.{selectedLegendPreset.mob_level}</span><span><strong>อากาศ</strong>{WEATHER_LABELS[selectedLegendPreset.weather] || selectedLegendPreset.weather}</span><span><strong>ผลการแข่ง</strong>{selectedLegendPreset.record_type === "official" ? "Official" : "Practice"}</span></div>
          </div>}
        </div>}

        {type === "debut" && <div className="booking-debut-lock"><Check size={18} /><div><strong>ค่ามาตรฐาน Debut</strong><span>สุ่มสภาพอากาศ · แข่งแบบ Official · Mob Lv.2 · ลงได้สัปดาห์ละ 1 ครั้ง</span></div></div>}

        {error && <p className="booking-form-error" role="alert">{error}</p>}
        <div className="booking-form-footer"><span>{stageName}{date ? ` · ${date}` : ""} · {atMidnight ? "24:00" : time} (เวลาไทย)</span><button className="booking-submit" type="submit" disabled={busy || !options}>{busy ? "กำลังสร้าง…" : "สร้างการจอง"}<ChevronRight size={18} /></button></div>
      </form>
      {selectedSkill && createPortal(
        <div className="skill-loadout-detail-backdrop" onMouseDown={() => setSelectedSkill(null)}>
          <section className="skill-loadout-detail-modal" role="dialog" aria-modal="true" aria-labelledby="legend-skill-detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="skill-loadout-detail-close" aria-label="ปิดรายละเอียดสกิล" onClick={() => setSelectedSkill(null)}>×</button>
            <div className="skill-loadout-detail-heading">
              <div className="skill-icon-box">{getSkillIcon(selectedSkill.icon)}</div>
              <div><span>{selectedSkill.id}</span><h3 id="legend-skill-detail-title">{selectedSkill.name}</h3></div>
            </div>
            <div className="skill-loadout-detail-meta"><span>CD {selectedSkill.cooldown ?? 0}</span><span>Cost {selectedSkill.cost ?? 0}</span>{selectedSkill.target ? <span>{renderSkillText(selectedSkill.target)}</span> : null}</div>
            {selectedSkill.trigger ? <p><strong>เงื่อนไข:</strong> {renderSkillText(selectedSkill.trigger)}</p> : null}
            {selectedSkill.effects?.length > 0 && <div className="skill-loadout-detail-effects"><strong>ผลของสกิล</strong><ul>{selectedSkill.effects.map((effect, index) => <li key={`${selectedSkill.id}-${index}`}>{renderSkillText(describeRaceEffect(effect))}</li>)}</ul></div>}
          </section>
        </div>,
        document.body
      )}
    </section>
  );
}

export default function RoomBookingPage({ userId, accountRole, username }) {
  const [rooms, setRooms] = useState([]);
  const [view, setView] = useState("list");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await listRoomBookings(userId);
      setRooms(data.rooms || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 60000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const join = async (room) => {
    setBusyId(room.booking_id);
    setError("");
    try {
      await joinRoomBooking(room.booking_id, userId);
      await refresh();
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="room-booking-page">
      {view === "create" ? <CreateBooking userId={userId} accountRole={accountRole} onBack={() => setView("list")} onCreated={async () => { await refresh(); setView("list"); }} /> : <>
        <header className="room-booking-header">
          <div className="room-booking-title-wrap"><span className="room-booking-emblem"><CalendarClock size={25} /></span><div><span className="booking-eyebrow">TRACEN · RACE DESK</span><h2>ห้องแข่งขัน</h2><p>ตารางห้องนัดหมายและห้องที่กำลังเปิดใน Discord</p></div></div>
          <div className="room-booking-header-actions"><button className="booking-refresh" type="button" onClick={refresh} aria-label="รีเฟรชรายการ"><RefreshCw size={17} /></button>{["trainer", "trainee"].includes(accountRole) && <button className="booking-create-button" type="button" onClick={() => setView("create")}><Plus size={18} /> {accountRole === "trainee" ? "สร้าง Legend Race" : "สร้างห้อง"}</button>}</div>
        </header>
        <div className="room-booking-summary"><span><i /> แสดงเวลาไทย (UTC+7)</span><span>{rooms.length} ห้องในรายการ</span>{username && <span>เข้าสู่ระบบในชื่อ {username}</span>}</div>
        {error && <div className="booking-error-banner" role="alert">{error}</div>}
        {loading ? <div className="booking-loading">กำลังโหลดรายการห้อง…</div> : rooms.length ? <div className="booking-room-list">{rooms.map((room) => <RoomCard key={room.booking_id} room={room} accountRole={accountRole} userId={userId} onJoin={join} busyId={busyId} />)}</div> : <div className="booking-empty"><span><CalendarClock size={28} /></span><h3>ยังไม่มีห้องที่กำลังเปิดจอง</h3><p>{accountRole === "trainer" ? "สร้างห้องใหม่ แล้วกำหนดเวลาที่ต้องการให้เปิดใน Discord" : accountRole === "trainee" ? "สร้าง Legend Race ของตัวเอง หรือรอห้องจาก Trainer" : "เมื่อ Trainer เปิดห้องใหม่ รายการจะแสดงที่นี่"}</p>{["trainer", "trainee"].includes(accountRole) && <button type="button" onClick={() => setView("create")}><Plus size={17} /> {accountRole === "trainee" ? "สร้าง Legend Race" : "สร้างห้องแรก"}</button>}</div>}
      </>}
    </div>
  );
}
