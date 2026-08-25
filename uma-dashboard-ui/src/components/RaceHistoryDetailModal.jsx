import { useEffect, useState } from "react";
import { Badge, Button } from "./ui";
import { BOT_API_BASE } from "../api/playerApi";
import { mainStats, aptitudeRows } from "../data/dashboardConfig";
import StatCell from "./StatCell";
import AptitudeItem from "./AptitudeItem";
import { getSkillIcon } from "../utils/getSkillIcon";
import "../styles/skillsPage.css";

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

function skillDetails(skill, skillCatalog = {}) {
  if (typeof skill === "string") {
    const catalogSkill = skillCatalog[skill] || {};
    return { id: skill, name: catalogSkill.name || skill, icon: catalogSkill.icon || null };
  }
  const id = skill?.id || skill?.skill_id || "-";
  const catalogSkill = skillCatalog[id] || {};
  return {
    id,
    name: skill?.name && skill.name !== id ? skill.name : catalogSkill.name || skill?.name || id,
    icon: skill?.icon || catalogSkill.icon,
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

function RaceResultTable({ turns }) {
  return (
    <section className="race-history-table-section">
      <span>ผลการทอยแต่ละเทิร์น</span>
      {turns.length ? <div className="race-history-table-wrap"><table>
        <thead><tr><th>เทิร์น</th><th>ผลทอย</th><th>คะแนนรวม</th><th>เลน</th><th>อันดับ</th></tr></thead>
        <tbody>{turns.map((turn) => <tr key={`${turn.participant_id}-${turn.turn_number}`}>
          <td>T{turn.turn_number}</td><td>+{turn.run_score ?? "-"}</td><td>{turn.score_after ?? "-"}</td><td>{turn.lane ?? "-"}</td><td>#{turn.position ?? "-"}</td>
        </tr>)}</tbody>
      </table></div> : <p>ยังไม่มีผลทอยที่บันทึกไว้</p>}
    </section>
  );
}

function RaceActionTable({ actions }) {
  return (
    <section className="race-history-table-section">
      <span>Action Log</span>
      {actions.length ? <div className="race-history-table-wrap"><table>
        <thead><tr><th>เทิร์น</th><th>ประเภท</th><th>รายละเอียด</th></tr></thead>
        <tbody>{actions.map((action) => <tr key={action.action_id}>
          <td>T{action.turn_number}</td><td><code>{action.action_type}</code></td><td>{formatRaceAction(action)}</td>
        </tr>)}</tbody>
      </table></div> : <p>ยังไม่มีบันทึกการกระทำ</p>}
    </section>
  );
}

export default function RaceHistoryDetailModal({ raceId, fallback, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skillCatalog, setSkillCatalog] = useState({});

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
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/skills?tag=all`, { signal: controller.signal })
      .then((res) => res.ok ? res.json() : [])
      .then((skills) => {
        if (!Array.isArray(skills)) return;
        setSkillCatalog(Object.fromEntries(
          skills.filter((skill) => skill?.id).map((skill) => [skill.id, skill])
        ));
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setSkillCatalog({});
      });
    return () => controller.abort();
  }, []);

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
                        {mainStats.some((stat) => baseStats[stat.key] !== null && baseStats[stat.key] !== undefined) ? <div className="stats-grid">
                          {mainStats.map((stat) => <StatCell key={stat.key} statKey={stat.key} label={stat.label} value={baseStats[stat.key]} />)}
                        </div> : <p>{notRecorded}</p>}
                      </div>
                      <div className="race-history-snapshot-card">
                        <span>ความถนัด</span>
                        {Object.keys(aptitudes).length ? <div className="aptitude-table race-history-profile-aptitudes">
                          {aptitudeRows.map((row) => <div className="aptitude-row" key={row.title}>
                            <div className="aptitude-row-title">{row.title}</div>
                            <div className="aptitude-row-items">{row.items.map((item) => <AptitudeItem key={item.key} label={item.label} value={aptitudes[item.key]} />)}</div>
                          </div>)}
                        </div> : <p>{notRecorded}</p>}
                      </div>
                      <div className="race-history-snapshot-card race-history-skills-card">
                        <span>สกิล</span>
                        {skills.length ? <div className="skill-loadout-list race-history-profile-skills">{skills.map((skill, index) => {
                          const detail = skillDetails(skill, skillCatalog);
                          return <div className="skill-loadout-item" key={`${detail.id}-${index}`}>
                            <span className="skill-loadout-slot">{index + 1}</span>
                            <div className="skill-icon-box">{getSkillIcon(detail.icon)}</div>
                            <span className="skill-loadout-name">{detail.name}</span>
                            <code className="race-history-skill-id">{detail.id}</code>
                          </div>;
                        })}</div> : <p>{notRecorded}</p>}
                      </div>
                      <div className="race-history-snapshot-card race-history-zone-card">
                        <span>Zone</span>
                        <strong>{snapshot.zone?.name || snapshot.zone?.zone_name || notRecorded}</strong>
                      </div>
                    </div>
                    <RaceResultTable turns={participantTurns} />
                    <RaceActionTable actions={participantActions} />
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
