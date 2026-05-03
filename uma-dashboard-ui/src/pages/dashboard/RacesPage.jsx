import React, { useEffect, useMemo, useState } from "react";
import "../../styles/skillsPage.css";
import { playSound } from "../../utils/soundManager";
import { raceImageMap } from "../../utils/raceSchedule.js";
import Toast from "../../components/Toast";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const DISTANCE_FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "sprint", label: "Sprint" },
  { value: "mile", label: "Mile" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const PATH_ICON = {
  1: "➡️",
  2: "⤵️",
  3: "↗️",
  4: "↘️",
};

export default function RacesPage({ userId }) {
  const [races, setRaces] = useState([]);
  const [activeDistance, setActiveDistance] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRace, setSelectedRace] = useState(null);

  useEffect(() => {
    fetch(`${BOT_API_BASE}/races`)
      .then((res) => res.json())
      .then((data) => setRaces(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const [toast, setToast] = useState(null);

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

      return matchSearch && matchDistance;
    });
  }, [races, search, activeDistance]);

  const createRaceRoom = async () => {
    if (!selectedRace) return;

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

  return (
    <section className="skills-page">
      <div className="sheet-card">
        <div className="title-banner">
          <h2>รายการสนามทั้งหมด</h2>
        </div>

        <div className="skills-toolbar">
          <input
            className="search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search race name / id / track..."
          />

          <div className="skills-filter-row">
            {DISTANCE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`filter-btn ${
                  activeDistance === filter.value ? "active" : ""
                }`}
                onClick={() => {
                  playSound("click");
                  setActiveDistance(filter.value);
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="skills-count">พบ {filteredRaces.length} สนาม</div>

      <div className="skills-grid">
        {filteredRaces.map((race) => {
          const raceImg = raceImageMap[race.id];

          return (
            <article
              className="race-card"
              key={race.id}
              onClick={() => {
                playSound("open");
                setSelectedRace(race);
              }}
            >

              <div className="race-stage-icon-box">
                  {raceImg ? (
                    <img
                      src={raceImg}
                      alt={race.name}
                      className="race-card-img"
                    />
                  ) : (
                    "🏟️"
                  )}
              </div>

              <div className="race-id">{race.name}</div>


              <div className="skill-main-row">
                <div className="skill-content">
                  <div className="skill-meta-row">
                    <span>{race.distance}</span>
                    <span>{race.track}</span>
                    <span>{race.turn} Turns</span>
                  </div>

                  {/* <div className="skill-trigger">
                    <strong>Path:</strong>{" "}
                    {race.path?.length ? race.path.join(" / ") : "-"}
                  </div> */}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selectedRace && (
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
                  src={raceImageMap[selectedRace.id]}
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

              <div className="race-room-actions">
                <button
                  className="zone-cancel-btn"
                  onClick={() => setSelectedRace(null)}
                >
                  ยกเลิก
                </button>

                <button
                  className="zone-save-btn"
                  onClick={createRaceRoom}
                >
                  สร้างห้อง
                </button>
              </div>
            </div>
          </div>
        </div>
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