import React, { useMemo, useState } from "react";
import "../../styles/charactersPage.css";
import rose_garden_img from "../../assets/character/rose_garden.png"
import special_week_img from "../../assets/character/special_week.png"
import john_musume_img from "../../assets/character/john_musume.png"

const characters = [
  {
    id: 1,
    name: "Oguri Cap",
    jpName: "オグリキャップ",
    type: "Trainee",
    image: john_musume_img,
  },
  {
    id: 2,
    name: "Special Week",
    jpName: "スペシャルウィーク",
    type: "Trainee",
    image: special_week_img,
  },
  {
    id: 3,
    name: "Tokai Teio",
    jpName: "トウカイテイオー",
    type: "Trainee",
    image: john_musume_img,
  },
  {
    id: 4,
    name: "Rose Garden",
    jpName: "ローズ・ガーデン",
    type: "Trainee",
    image: rose_garden_img,
  },
];

const filters = ["All", "Trainee", "Trainer"];

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredCharacters = useMemo(() => {
    return characters.filter((character) => {
      const matchSearch =
        character.name.toLowerCase().includes(search.toLowerCase()) ||
        character.jpName.includes(search);

      const matchFilter =
        activeFilter === "All" || character.type === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [search, activeFilter]);

  return (
    <section className="characters-page">
      <div className="characters-hero">
        <div>
          {/* <p className="characters-kicker">Tracen Academy</p> */}
          <h2>Characters</h2>
          <p>เลือกดูข้อมูลตัวละคร / นักแข่งของเซิร์ฟเวอร์</p>
        </div>
      </div>

      <div className="characters-toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search character..."
          className="characters-search"
        />

        <div className="characters-filters">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`character-filter-btn ${
                activeFilter === filter ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="characters-grid">
        {filteredCharacters.map((character) => (
          <article className="character-card" key={character.id}>
            <div className="character-image-frame">
              {character.image ? (
                <img src={character.image} alt={character.name} />
              ) : (
                <img src={special_week_img} alt={character.name} />
              )}
            </div>

            <div className="character-info">
              <h3>{character.name}</h3>
              {/* <p>{character.jpName}</p> */}

              <div className="character-bottom">
                <span>{character.type}</span>
                <button type="button">View</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}