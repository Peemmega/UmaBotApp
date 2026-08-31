import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/skillsPage.css";
import { playSound } from "../../utils/soundManager";
import { getRaceImage } from "../../utils/raceSchedule.js";
import Toast from "../../components/Toast";
import SharedRaceHistoryDetailModal from "../../components/RaceHistoryDetailModal";
import { Badge, Button, FilterTabs, GameCard, Pagination, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { BOT_API_BASE } from "../../api/playerApi";
import { IS_MAIN_WEB } from "../../api/appConfig";


const DISTANCE_FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "sprint", label: "Sprint" },
  { value: "mile", label: "Mile" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const TRACK_FILTERS = [
  { value: "all", label: "All tracks" },
  { value: "turf", label: "Turf" },
  { value: "dirt", label: "Dirt" },
];

const PATH_ICON = {
  1: "➡️",
  2: "⤵️",
  3: "↗️",
  4: "↘️",
};

const RACE_HISTORY_PAGE_SIZE = 8;

export default function RacesPage({ userId, profileType = "trainee" }) {
  const [races, setRaces] = useState([]);
  const [activeDistance, setActiveDistance] = useState("all");
  const [activeTrack, setActiveTrack] = useState("all");
  const [activeVenue, setActiveVenue] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRace, setSelectedRace] = useState(null);
  const [raceHistory, setRaceHistory] = useState([]);
  const [historyRecordType, setHistoryRecordType] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedRaceResult, setSelectedRaceResult] = useState(null);

  useEffect(() => {
    fetch(`${BOT_API_BASE}/races`)
      .then((res) => res.json())
      .then((data) => setRaces(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRace?.id) {
      setRaceHistory([]);
      setHistoryError("");
      setHistoryPage(1);
      return undefined;
    }

    const controller = new AbortController();
    setHistoryLoading(true);
    setHistoryError("");

    fetch(`${BOT_API_BASE}/race-history?stage_key=${encodeURIComponent(selectedRace.id)}&limit=50`, {
      signal: controller.signal,
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Could not load race history")))
      .then((data) => {
        setRaceHistory(Array.isArray(data?.races) ? data.races : []);
        setHistoryPage(1);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setHistoryError("ไม่สามารถโหลดประวัติการแข่งขันได้");
      })
      .finally(() => setHistoryLoading(false));

    return () => controller.abort();
  }, [selectedRace?.id]);

  const [toast, setToast] = useState(null);

  const filteredRaceHistory = useMemo(
    () => raceHistory.filter((record) => (
      historyRecordType === "all" || record.record_type === historyRecordType
    )),
    [raceHistory, historyRecordType]
  );
  const historyPageCount = Math.max(
    1,
    Math.ceil(filteredRaceHistory.length / RACE_HISTORY_PAGE_SIZE)
  );
  const paginatedRaceHistory = useMemo(() => {
    const firstRecord = (historyPage - 1) * RACE_HISTORY_PAGE_SIZE;
    return filteredRaceHistory.slice(firstRecord, firstRecord + RACE_HISTORY_PAGE_SIZE);
  }, [filteredRaceHistory, historyPage]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const filteredRaces = useMemo(() => {
    return races.filter((race) => {
      const q = search.toLowerCase();
      const raceDistance = race.distance?.toLowerCase() || "";

      const matchSearch =
        race.name?.toLowerCase().includes(q) ||
        race.id?.toLowerCase().includes(q) ||
        race.track?.toLowerCase().includes(q) ||
        raceDistance.includes(q);

      const matchDistance =
        activeDistance === "all" || raceDistance === activeDistance;

      const matchTrack =
        activeTrack === "all" || String(race.track || "").toLowerCase() === activeTrack;

      const matchVenue =
        activeVenue === "all" || String(race.venue || "Other") === activeVenue;

      return matchSearch && matchDistance && matchTrack && matchVenue;
    });
  }, [races, search, activeDistance, activeTrack, activeVenue]);

  const venueOptions = useMemo(
    () => Array.from(new Set(races.map((race) => race.venue || "Other"))).sort((a, b) => a.localeCompare(b)),
    [races]
  );

  const resetFilters = () => {
    setSearch("");
    setActiveDistance("all");
    setActiveTrack("all");
    setActiveVenue("all");
  };

  const hasActiveFilters = search || activeDistance !== "all" || activeTrack !== "all" || activeVenue !== "all";

  const createRaceRoom = async () => {
    if (IS_MAIN_WEB || !selectedRace) return;

    const res = await fetch(`${BOT_API_BASE}/race/room/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: String(userId),
        race_id: selectedRace.id,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.message || "สร้างห้องไม่สำเร็จ", "error");
      return;
    }

    showToast(data.message || "สร้างห้องสำเร็จ", "success");
  };

  const formatPath = (path = []) => {
    return path
      .map((p) => PATH_ICON[p] || p)
      .join(" ");
  };

  const formatRaceDate = (value) => {
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
  };

  return (
    <section className="skills-page">
      <GameCard className="page-control-card race-page-card">
        <SectionHeader
          title="รายการสนามทั้งหมด"
          kicker="Race Selection"
          action={<Badge>{filteredRaces.length} สนาม</Badge>}
        />

        <div className="skills-toolbar">
          <div className="race-directory-filter-grid">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสนาม..."
          />

            <label className="race-directory-select">
              <span>Racetrack</span>
              <select value={activeVenue} onChange={(event) => setActiveVenue(event.target.value)}>
                <option value="all">All racetracks</option>
                {venueOptions.map((venue) => <option key={venue} value={venue}>{venue}</option>)}
              </select>
            </label>

            {hasActiveFilters ? (
              <Button variant="ghost" className="race-reset-filters" onClick={resetFilters}>
                Reset filters
              </Button>
            ) : null}
          </div>

          <div className="race-directory-filter-group">
            <span className="race-directory-filter-label">Track</span>
            <FilterTabs
              items={TRACK_FILTERS}
              value={activeTrack}
              onChange={(value) => {
                playSound("click");
                setActiveTrack(value);
              }}
              className="skills-filter-row"
            />
          </div>

          <div className="race-directory-filter-group">
            <span className="race-directory-filter-label">Distance</span>
          <FilterTabs
            items={DISTANCE_FILTERS}
            value={activeDistance}
            onChange={(value) => {
              playSound("click");
              setActiveDistance(value);
            }}
            className="skills-filter-row"
          />
          </div>
        </div>
      </GameCard>
      
      {filteredRaces.length === 0 ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>ไม่พบสนาม</strong>
              <span>ลองค้นหาใหม่อีกครั้ง.</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : (
        <StaggerContainer
          className="skills-grid race-grid race-directory-grid"
          key={`${activeDistance}-${activeTrack}-${activeVenue}-${search}`}
        >
          {filteredRaces.map((race) => {
          const raceImg = getRaceImage(race);

          return (
            <StaggerItem
              as="article"
              className="ui-game-card race-card"
              key={race.id}
              onClick={() => {
                playSound("open");
                setSelectedRace(race);
                setHistoryPage(1);
              }}
            >

              <div className="race-stage-icon-box race-directory-image">
                  <img
                    src={raceImg}
                    alt={race.name}
                    className="race-card-img"
                  />
              </div>

              <div className="race-card-body">
                <div className="race-id">{race.name}</div>


                <div className="skill-main-row">
                  <div className="skill-content">
                    <div className="content-meta-row race-meta-row">
                      <span>{race.venue || "Other"}</span>
                      <span className={`race-surface-tag is-${race.track}`}>{race.track}</span>
                      <span className="race-distance-label">{race.distance}</span>
                      <span>{race.turn} Turns</span>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
          })}
        </StaggerContainer>
      )}

      {selectedRace && createPortal(
        <div className={`profile-theme-${profileType} profile-theme-portal`}>
          <div
            className="zone-edit-backdrop"
            onClick={() => setSelectedRace(null)}
          >
          <div
            className="zone-edit-modal race-room-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="title-banner">
              <h2>Race Lobby</h2>
            </div>

            <div className="zone-edit-body">
              <div className="race-room-header">
                <div>
                  <h2>{selectedRace.name}</h2>
                  <p>ข้อมูลสนามแข่ง</p>
                </div>

                <img
                  src={getRaceImage(selectedRace)}
                  alt={selectedRace.name}
                />
              </div>

              <div className="zone-divider" />

              <div className="race-room-info-grid">
                <div className="race-room-info-card">
                  <span>จำนวนเทิร์น</span>
                  <strong>{selectedRace.turn}</strong>
                </div>

                <div className="race-room-info-card">
                  <span>ประเภท</span>
                  <strong>
                    {selectedRace.track} / {selectedRace.distance}
                  </strong>
                </div>
              </div>

              <div className="race-room-path-card">
                <span>เส้นทาง</span>
                <p>{formatPath(selectedRace.path)}</p>
              </div>

              <section className="race-history-section">
                <div className="race-history-section-heading">
                  <div>
                    <span>ประวัติสนาม</span>
                    <h3>ประวัติการแข่ง ({filteredRaceHistory.length})</h3>
                  </div>
                  <label className="race-history-record-filter">
                    <span>ประเภท</span>
                    <select
                      value={historyRecordType}
                      onChange={(event) => {
                        playSound("click");
                        setHistoryRecordType(event.target.value);
                        setHistoryPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      <option value="official">Official</option>
                      <option value="practice">Practice</option>
                    </select>
                  </label>
                </div>
                {historyLoading ? <p className="race-history-status">กำลังโหลดรายการแข่งขัน...</p> : historyError ? <p className="race-history-status is-error">{historyError}</p> : filteredRaceHistory.length ? (
                  <div className="race-history-summary-list">
                    {paginatedRaceHistory.map((record) => <button
                      type="button"
                      className="race-history-summary-row"
                      key={record.race_id}
                      onClick={() => setSelectedRaceResult(record)}
                    >
                      <time>{formatRaceDate(record.finished_at)}</time>
                      <span><small>ผู้ชนะ</small><strong>{record.winner_name || "-"}</strong></span>
                      <span><small>คะแนน</small><strong>{Number(record.winner_score || 0).toLocaleString()}</strong></span>
                      <em>{record.record_type === "practice" ? "Practice" : "Official"}</em>
                    </button>)}
                  <Pagination
                    page={historyPage}
                    pageCount={historyPageCount}
                    onPageChange={setHistoryPage}
                    label="ประวัติการแข่งขัน"
                  />
                  </div>
                ) : <p className="race-history-status">{historyRecordType === "all" ? "ยังไม่มีการแข่งขันที่จบแล้วในสนามนี้" : "ไม่พบประวัติการแข่งประเภทที่เลือก"}</p>}
              </section>

              <div className="race-room-actions">
                <Button
                  variant="ghost"
                  className="zone-cancel-btn"
                  onClick={() => setSelectedRace(null)}
                >
                  ยกเลิก
                </Button>

                {!IS_MAIN_WEB && (
                  <Button
                    variant="primary"
                    className="zone-save-btn"
                    onClick={createRaceRoom}
                  >
                    สร้างห้อง
                  </Button>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>,
        document.body
      )}

      {selectedRaceResult && createPortal(
        <div className={`profile-theme-${profileType} profile-theme-portal`}>
          <SharedRaceHistoryDetailModal
            raceId={selectedRaceResult.race_id}
            fallback={selectedRaceResult}
            onClose={() => setSelectedRaceResult(null)}
          />
        </div>,
        document.body
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </section>
  );
}

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

function formatSnapshotValues(values) {
  if (!values || typeof values !== "object") return [];
  return Object.entries(values)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
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

function RaceHistoryDetailModal({ raceId, fallback, onClose }) {
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
                const notRecorded = "ยังไม่มีบันทึกในระบบ";
                return <details className="race-history-participant" key={participant.participant_id}>
                  <summary>
                    <strong>#{participant.final_rank || "-"}</strong>
                    <span><b>{participant.uma_name}</b><small>{participant.trainer_name || "ไม่มีเทรนเนอร์"} · {participant.running_style || "-"}</small></span>
                    <em>{Number(participant.final_score || 0).toLocaleString()} คะแนน</em>
                  </summary>
                  <div className="race-history-participant-detail">
                    <div className="race-history-snapshot-grid">
                      <div><span>ค่าสถานะ</span><p>{formatSnapshotValues(snapshot.base_stats).join(" · ") || notRecorded}</p></div>
                      <div><span>ความถนัด</span><p>{formatSnapshotValues(snapshot.aptitudes).join(" · ") || notRecorded}</p></div>
                      <div><span>สกิล</span><p>{skills.map((skill) => skill?.name || skill?.id || String(skill)).join(", ") || notRecorded}</p></div>
                      <div><span>Zone</span><p>{snapshot.zone?.name || snapshot.zone?.zone_name || notRecorded}</p></div>
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
