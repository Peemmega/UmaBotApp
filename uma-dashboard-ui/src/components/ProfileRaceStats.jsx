import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BOT_API_BASE } from "../api/playerApi";
import RaceHistoryDetailModal from "./RaceHistoryDetailModal";
import { Pagination } from "./ui";

const PAGE_SIZE = 6;
const RECORD_FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "official", label: "ทางการ" },
  { value: "practice", label: "ซ้อม" },
];

function getPlacement(record) {
  const value = Number(record?.final_rank ?? record?.placement ?? record?.rank ?? record?.position ?? record?.place);
  return Number.isFinite(value) ? value : null;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-nu-latn", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export default function ProfileRaceStats({ userId }) {
  const [races, setRaces] = useState([]);
  const [recordType, setRecordType] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRace, setSelectedRace] = useState(null);

  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();

    async function loadAllRaces() {
      setLoading(true);
      setError("");
      try {
        const allRaces = [];
        let offset = 0;
        while (true) {
          const response = await fetch(`${BOT_API_BASE}/player/${encodeURIComponent(userId)}/race-history?limit=100&offset=${offset}`, { signal: controller.signal });
          if (!response.ok) throw new Error("ไม่สามารถโหลดประวัติการแข่งได้");
          const data = await response.json();
          const batch = Array.isArray(data?.races) ? data.races : [];
          allRaces.push(...batch);
          if (batch.length < 100) break;
          offset += batch.length;
        }
        if (!controller.signal.aborted) setRaces(allRaces);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError.message || "เกิดข้อผิดพลาดระหว่างโหลดประวัติการแข่ง");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAllRaces();
    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedRace(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const filteredRaces = useMemo(() => races.filter((race) => recordType === "all" || race.record_type === recordType), [races, recordType]);
  const pageCount = Math.max(1, Math.ceil(filteredRaces.length / PAGE_SIZE));
  const pageRaces = filteredRaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const placements = filteredRaces.reduce((counts, race) => {
    const place = getPlacement(race);
    if (place === 1) counts.first += 1;
    if (place === 2) counts.second += 1;
    if (place === 3) counts.third += 1;
    return counts;
  }, { first: 0, second: 0, third: 0 });

  return (
    <section className="profile-race-stats" aria-labelledby="profile-race-title">
      <header className="profile-library-header profile-race-header">
        <div><span>RACE RECORD</span><h2 id="profile-race-title">สถิติการแข่ง</h2></div>
        <label className="profile-race-filter">
          <span>ประเภทการแข่ง</span>
          <select value={recordType} onChange={(event) => { setRecordType(event.target.value); setPage(1); }}>
            {RECORD_FILTERS.map((filter) => <option key={filter.value} value={filter.value}>{filter.label}</option>)}
          </select>
        </label>
      </header>

      {loading ? <p className="profile-page-status">กำลังโหลดประวัติการแข่ง...</p> : error ? <p className="profile-page-status is-error">{error}</p> : (
        <>
          <div className="profile-race-summary" aria-label="สรุปผลการแข่งขัน">
            <div><span>จำนวนการแข่ง</span><strong>{filteredRaces.length.toLocaleString()}</strong></div>
            <div><span>ที่ 1</span><strong>{placements.first.toLocaleString()}</strong></div>
            <div><span>ที่ 2</span><strong>{placements.second.toLocaleString()}</strong></div>
            <div><span>ที่ 3</span><strong>{placements.third.toLocaleString()}</strong></div>
          </div>

          <section className="profile-race-list-section" aria-labelledby="profile-race-list-title">
            <div className="profile-race-list-heading"><h3 id="profile-race-list-title">ประวัติการแข่งทั้งหมด</h3><span>{filteredRaces.length.toLocaleString()} รายการ</span></div>
            {pageRaces.length ? (
              <>
                <div className="profile-race-table-wrap">
                  <table className="profile-race-table">
                    <thead><tr><th>วันที่</th><th>รายการแข่ง</th><th>ประเภท</th><th>อันดับ</th><th>คะแนน</th></tr></thead>
                    <tbody>
                      {pageRaces.map((race, index) => {
                        const place = getPlacement(race);
                        const raceName = race.stage_name || race.race_name || race.name || race.stage_key || "รายการแข่ง";
                        return <tr key={race.race_id || race.id || `${raceName}-${index}`}>
                          <td>{formatDate(race.finished_at)}</td>
                          <td><button type="button" className="profile-race-open" onClick={() => setSelectedRace(race)}>{raceName}</button></td>
                          <td><span className={`profile-race-type is-${race.record_type === "official" ? "official" : "practice"}`}>{race.record_type === "official" ? "ทางการ" : "ซ้อม"}</span></td>
                          <td><strong className={place && place <= 3 ? `profile-race-place place-${place}` : "profile-race-place"}>{place ? `ที่ ${place}` : "-"}</strong></td>
                          <td>{Number.isFinite(Number(race.final_score)) ? Number(race.final_score).toLocaleString() : "-"}</td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} pageCount={pageCount} onPageChange={setPage} label="ประวัติการแข่ง" />
              </>
            ) : <p className="profile-page-status">ยังไม่มีประวัติการแข่งในประเภทนี้</p>}
          </section>
        </>
      )}

      {selectedRace && createPortal(<RaceHistoryDetailModal raceId={selectedRace.race_id} fallback={selectedRace} onClose={() => setSelectedRace(null)} />, document.body)}
    </section>
  );
}
