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

  return (
    <section className="skills-page">
      <div className="sheet-card">
        <div className="title-banner">
          <h2>รายการสนามทั้งหมด</h2>
        </div>

        <div className="skills-toolbar">
          <input
            className="skills-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search race name / id / track..."
          />

          <div className="skills-filter-row">
            {DISTANCE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`skill-filter-btn ${
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
        <div className="skill-equip-backdrop" onClick={() => setSelectedRace(null)}>
          <div className="race-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="skill-equip-close"
              onClick={() => setSelectedRace(null)}
            >
              ×
            </button>

            <div className="race-detail-header">
              <div>
                <h2>🏟️ {selectedRace.name}</h2>
                <p>เตรียมตัวเข้าสู่สนามแข่ง 🏇</p>
              </div>

              <img
                src={raceImageMap[selectedRace.id]}
                alt={selectedRace.name}
              />
            </div>

            <div className="race-detail-info">
              <h3>⏱️ เทิร์น</h3>
              <p>{selectedRace.turn}</p>

              <h3>🗺️ เส้นทาง</h3>
              <p>{selectedRace.path?.join(" ➜ ")}</p>

              <h3>📌 ประเภท</h3>
              <p>{selectedRace.track} / {selectedRace.distance}</p>
            </div>

            <button className="create-room-btn" onClick={createRaceRoom}>
              สร้างห้อง
            </button>
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