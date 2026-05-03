import React, { useEffect, useMemo, useState } from "react";
import "../../styles/skillsPage.css";
import { playSound } from "../../utils/soundManager";
import { raceImageMap } from "../../utils/raceSchedule.js";

const BOT_API_BASE = "https://umadndbot-production.up.railway.app";

const DISTANCE_FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "sprint", label: "Sprint" },
  { value: "mile", label: "Mile" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export default function RacesPage() {
  const [races, setRaces] = useState([]);
  const [activeDistance, setActiveDistance] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${BOT_API_BASE}/races`)
      .then((res) => res.json())
      .then((data) => setRaces(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

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
            <article className="skill-card" key={race.id}>
              <div className="skill-top-row">
                <div className="skill-icon-box">
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

                <div className="skill-id">{race.id}</div>
                <h3>{race.name}</h3>
              </div>

              <div className="skill-main-row">
                <div className="skill-content">
                  <div className="skill-meta-row">
                    <span>{race.distance}</span>
                    <span>{race.track}</span>
                    <span>{race.turn} Turns</span>
                  </div>

                  <div className="skill-trigger">
                    <strong>Path:</strong>{" "}
                    {race.path?.length ? race.path.join(" / ") : "-"}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}