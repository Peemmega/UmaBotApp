import { useEffect, useState } from "react";
import { Badge, Button } from "./ui";
import { BOT_API_BASE } from "../api/playerApi";
import speedIcon from "../assets/icons/Speed.webp";
import staminaIcon from "../assets/icons/Stamina.webp";
import powerIcon from "../assets/icons/Power.webp";
import gutIcon from "../assets/icons/Gut.webp";
import witIcon from "../assets/icons/Wit.webp";
import { getSkillIcon } from "../utils/getSkillIcon";
import "../styles/skillsPage.css";

const STAT_DEFINITIONS = [
  { key: "speed", label: "Speed", icon: speedIcon },
  { key: "stamina", label: "Stamina", icon: staminaIcon },
  { key: "power", label: "Power", icon: powerIcon },
  { key: "gut", label: "Guts", icon: gutIcon },
  { key: "wit", label: "Wit", icon: witIcon },
];

const APTITUDE_LABELS = {
  turf: "Turf", dirt: "Dirt", sprint: "Sprint", mile: "Mile",
  medium: "Medium", long: "Long", front: "Front", pace: "Pace",
  late: "Late", end_style: "End",
};

function formatHistoryDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function skillDetails(skill) {
  if (typeof skill === "string") return { id: skill, name: skill, icon: null };
  return {
    id: skill?.id || skill?.skill_id || "-",
    name: skill?.name || skill?.id || skill?.skill_id || "-",
    icon: skill?.icon,
  };
}

function formatRaceAction(action) {
  const data = action?.action_data || action?.action_data_json || {};
  const type = String(action?.action_type || "").toLowerCase();
  if (type === "skill") {
    const id = data.skill_id || "-";
    const name = data.skill_name ? ` (${data.skill_name})` : "";
    return `ใช้สกิล ${id}${name}`;
  }
  if (type === "lane_change" || type === "lane_change_queued") {
    const prefix = type === "lane_change_queued" ? "เลือกเปลี่ยนเลน" : "เปลี่ยนเลน";
    return `${prefix} ${data.from_lane ?? "-"} → ${data.to_lane ?? "-"}`;
  }
  if (type === "zone") return `ใช้ Zone ${data.zone_name || "-"}`;
  if (data.summary) return String(data.summary);
  if (type === "rush") return `ใช้ Rush +${data.move_forward ?? "-"}`;
  if (type === "block") return `ใช้ Block ถอย ${data.move_back ?? "-"}`;
  return action?.action_type || "-";
}

export default function RaceHistoryDetailModal({ raceId, fallback, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`${BOT_API_BASE}/race-history/${encodeURIComponent(raceId)}`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Could not load race detail")))
      .then((data) => setDetail(data))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError("ไม่สามารถโหลดรายละเอียดการแข่งขันได้");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [raceId]);

  useEffect(() => {
    const handleEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const race = detail?.race || fallback || {};
  const participants = detail?.participants || [];
  const turns = detail?.turns || [];
  const actions = detail?.actions || [];
  const turnsByParticipant = turns.reduce((result, turn) => {
    (result[turn.participant_id] ||= []).push(turn);
    return result;
  }, {});
  const actionsByParticipant = actions.reduce((result, action) => {
    (result[action.participant_id] ||= []).push(action);
    return result;
  }, {});

  return (
    <div className="zone-edit-backdrop race-history-backdrop" onClick={onClose}>
      <div className="zone-edit-modal race-history-detail-modal" role="dialog" aria-modal="true" aria-label="รายละเอียดการแข่งขัน" onClick={(event) => event.stopPropagation()}>
        <div className="title-banner"><h2>รายละเอียดการแข่งขัน</h2></div>
        <div className="zone-edit-body race-history-detail-body">
          <div className="race-history-detail-heading">
            <div><span>{formatHistoryDate(race.finished_at)}</span><h2>{race.stage_name || race.race_name || "การแข่งขัน"}</h2></div>
            <Badge>{race.record_type === "practice" ? "Practice" : "Official"}</Badge>
          </div>
          <div className="race-history-detail-meta">
            <span>{race.track || "-"}</span><span>{race.distance || "-"}</span><span>{race.total_turns || 0} Turns</span>
          </div>

          {loading ? <p className="race-history-status">กำลังโหลดผู้เข้าแข่ง...</p> : error ? <p className="race-history-status is-error">{error}</p> : (
            <section className="race-history-participants">
              <h3>ผู้เข้าแข่งทั้งหมด ({participants.length})</h3>
              {participants.map((participant) => {
                const snapshot = participant.snapshot || participant.snapshot_json || {};
                const participantTurns = turnsByParticipant[participant.participant_id] || [];
                const participantActions = actionsByParticipant[participant.participant_id] || [];
                const skills = Array.isArray(snapshot.skills) ? snapshot.skills : [];
                const baseStats = snapshot.base_stats || {};
                const aptitudes = snapshot.aptitudes || {};
                const notRecorded = "ยังไม่มีบันทึกในระบบ";
                return <details className="race-history-participant" key={participant.participant_id}>
                  <summary>
                    <strong>#{participant.final_rank || "-"}</strong>
                    <span><b>{participant.uma_name}</b><small>{participant.trainer_name || "ไม่มีเทรนเนอร์"} · {participant.running_style || "-"}</small></span>
                    <em>{Number(participant.final_score || 0).toLocaleString()} คะแนน</em>
                  </summary>
                  <div className="race-history-participant-detail">
                    <div className="race-history-snapshot-grid">
                      <div className="race-history-snapshot-card race-history-stats-card">
                        <span>ค่าสถานะ</span>
                        {STAT_DEFINITIONS.some((stat) => baseStats[stat.key] !== null && baseStats[stat.key] !== undefined) ? <div className="race-history-stat-grid">
                          {STAT_DEFINITIONS.map((stat) => <div className="race-history-stat-chip" key={stat.key}>
                            <img src={stat.icon} alt="" /><span>{stat.label}</span><strong>{baseStats[stat.key] ?? "-"}</strong>
                          </div>)}
                        </div> : <p>{notRecorded}</p>}
                      </div>
                      <div className="race-history-snapshot-card">
                        <span>ความถนัด</span>
                        {Object.keys(aptitudes).length ? <div className="race-history-aptitude-list">
                          {Object.entries(aptitudes).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => <span key={key}><small>{APTITUDE_LABELS[key] || key}</small><strong>{value}</strong></span>)}
                        </div> : <p>{notRecorded}</p>}
                      </div>
                      <div className="race-history-snapshot-card race-history-skills-card">
                        <span>สกิล</span>
                        {skills.length ? <div className="race-history-skill-list">{skills.map((skill, index) => {
                          const detail = skillDetails(skill);
                          return <div className="race-history-skill-chip" key={`${detail.id}-${index}`}>
                            <div className="race-history-skill-icon">{getSkillIcon(detail.icon)}</div>
                            <div><strong>{detail.name}</strong><code>{detail.id}</code></div>
                          </div>;
                        })}</div> : <p>{notRecorded}</p>}
                      </div>
                      <div className="race-history-snapshot-card race-history-zone-card">
                        <span>Zone</span>
                        <strong>{snapshot.zone?.name || snapshot.zone?.zone_name || notRecorded}</strong>
                      </div>
                    </div>
                    <div className="race-history-timeline">
                      <span>ผลแต่ละเทิร์น</span>
                      {participantTurns.length ? participantTurns.map((turn) => <p key={`${turn.participant_id}-${turn.turn_number}`}>T{turn.turn_number}: +{turn.run_score ?? "-"} · Score {turn.score_after} · Lane {turn.lane ?? "-"} · อันดับ {turn.position ?? "-"}</p>) : <p>-</p>}
                    </div>
                    <div className="race-history-timeline">
                      <span>การกระทำ</span>
                      {participantActions.length ? participantActions.map((action) => <p key={action.action_id}>T{action.turn_number}: {formatRaceAction(action)}</p>) : <p>ยังไม่มีบันทึกการกระทำ</p>}
                    </div>
                  </div>
                </details>;
              })}
            </section>
          )}

          <div className="race-room-actions race-history-detail-actions">
            <Button variant="ghost" className="zone-cancel-btn" onClick={onClose}>ปิด</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
