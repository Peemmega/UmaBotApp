import { useEffect, useState } from "react";
import { Clock3, Ticket, Users } from "lucide-react";
import { BOT_API_BASE } from "../api/playerApi";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok",
  }).format(date);
}

export default function RaceRegistrationPanel({ event, userId, profileType }) {
  const [roster, setRoster] = useState(null);
  const [team, setTeam] = useState([]);
  const [selectingMember, setSelectingMember] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const loadRoster = async () => {
    const response = await fetch(`${BOT_API_BASE}/race-registrations/race/${encodeURIComponent(event.id)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "ไม่สามารถโหลดรายชื่อผู้สมัครได้");
    setRoster(data);
  };

  useEffect(() => {
    setRoster(null);
    setTeam([]);
    setSelectingMember(false);
    setMessage("");
    loadRoster().catch((error) => setMessage(String(error.message || error)));
  }, [event.id]);

  const requestRegistration = async (traineeUserId) => {
    try {
      setBusy(true);
      setMessage("");
      const response = await fetch(`${BOT_API_BASE}/race-registrations/${encodeURIComponent(event.id)}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor_user_id: String(userId), trainee_user_id: String(traineeUserId) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "ส่งคำขอไม่สำเร็จ");
      setSelectingMember(false);
      setMessage(profileType === "trainer" ? "ส่งอีเมลให้สาวม้าเพื่อยืนยันแล้ว" : "ส่งอีเมลขออนุมัติให้ Trainer แล้ว");
      await loadRoster();
    } catch (error) {
      setMessage(String(error.message || error));
    } finally {
      setBusy(false);
    }
  };

  const openTeamPicker = async () => {
    try {
      setBusy(true);
      setMessage("");
      const response = await fetch(`${BOT_API_BASE}/trainer/${encodeURIComponent(userId)}/team`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "ไม่สามารถโหลดทีมได้");
      setTeam(data.members || []);
      setSelectingMember(true);
    } catch (error) {
      setMessage(String(error.message || error));
    } finally {
      setBusy(false);
    }
  };

  const window = roster?.window;
  const isOpen = Boolean(window?.is_open);
  const entries = roster?.entries || [];
  const waitlist = roster?.waitlist || [];

  return <section className="race-registration-panel" aria-label="ลงทะเบียนการแข่งขัน">
    <header>
      <div><Ticket size={18} aria-hidden="true" /><strong>ลงทะเบียนการแข่งขัน</strong></div>
      <span className={isOpen ? "is-open" : "is-closed"}>{isOpen ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}</span>
    </header>
    <p className="race-registration-window"><Clock3 size={15} /> เปิด {formatDateTime(window?.opens_at)} · ปิด {formatDateTime(window?.closes_at)}</p>
    <p className="race-registration-priority">จัดลำดับ: บัตร Trial → ลงแข่งเอง → Fans สูงสุด</p>

    {profileType === "trainer" ? <div className="race-registration-actions">
      {!selectingMember ? <button type="button" disabled={!isOpen || busy} onClick={openTeamPicker}>เลือกสาวม้าในทีมเพื่อลงทะเบียน</button> : <div className="race-registration-team-picker">
        <p>เลือกสาวม้า 1 คน ระบบจะส่งอีเมลให้ยืนยันก่อนลงทะเบียน</p>
        {team.map((member) => <button type="button" key={member.user_id} disabled={busy} onClick={() => requestRegistration(member.user_id)}>
          <span>{member.username}</span><small>{Number(member.fans || 0).toLocaleString("th-TH")} fans</small>
        </button>)}
        {!team.length ? <p>ยังไม่มีสาวม้าในทีม</p> : null}
        <button type="button" className="race-registration-cancel" onClick={() => setSelectingMember(false)}>ยกเลิก</button>
      </div>}
    </div> : profileType === "trainee" ? <div className="race-registration-actions">
      <button type="button" disabled={!isOpen || busy} onClick={() => requestRegistration(userId)}>ส่งคำขอให้ Trainer อนุมัติ</button>
    </div> : null}

    {message ? <p className="race-registration-message" role="status">{message}</p> : null}
    <div className="race-registration-roster">
      <p><Users size={15} /> ผู้เข้าแข่งขัน {entries.length}/18</p>
      {entries.length ? <ol>{entries.map((entry) => <li key={entry.id}><b>{entry.placement}</b><span>{entry.trainee_name}</span><small>{entry.trial_ticket ? "Trial · " : ""}{entry.availability === "self" ? "ลงแข่งเอง" : "Bot Auto"}</small></li>)}</ol> : <span>ยังไม่มีผู้ยืนยันลงทะเบียน</span>}
      {waitlist.length ? <details><summary>รายชื่อสำรอง {waitlist.length} คน</summary><ol>{waitlist.map((entry) => <li key={entry.id}><b>{entry.placement}</b><span>{entry.trainee_name}</span><small>{entry.trial_ticket ? "Trial · " : ""}{entry.availability === "self" ? "ลงแข่งเอง" : "Bot Auto"}</small></li>)}</ol></details> : null}
    </div>
  </section>;
}
