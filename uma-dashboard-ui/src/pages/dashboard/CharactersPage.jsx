import { useMemo, useState } from "react";
import "../../styles/charactersPage.css";
import rose_garden_img from "../../assets/character/uma/rose_garden.webp"
import manhattan_cafe_img from "../../assets/character/uma/manhattan_cafe.webp"
import calstone_light_o_img from "../../assets/character/uma/calstone_light_o.webp"

import spica_img from "../../assets/character/trainer/spica.webp"
import kaguya_img from "../../assets/character/trainer/kaguya.webp"
import gelbert_img from "../../assets/character/trainer/gelbert.webp"
import { Badge, FilterTabs, GameCard, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";

const characters = [
  {
    id: 1,
    name: "Calston Light O",
    type: "Trainee",
    image: calstone_light_o_img,
  },
  {
    id: 2,
    name: "Rose Garden",
    type: "Trainee",
    image: rose_garden_img,
  },
  {
    id: 3,
    name: "Manhattan Cafe",
    type: "Trainee",
    image: manhattan_cafe_img,
  },
  {
    id: 101,
    name: "Trainer Spica",
    type: "Trainer",
    image: spica_img,
  },
  {
    id: 102,
    name: "Ince Seiji",
    type: "Trainer",
    image: kaguya_img,
  },
  {
    id: 103,
    name: "Yataio Galeberg",
    type: "Trainer",
    image: gelbert_img,
  },
];

const filters = ["All", "Trainee", "Trainer"];

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return characters.filter((character) => {
      const name = character.name?.toLowerCase() || "";
      const jpName =
        typeof character.jpName === "string"
          ? character.jpName.toLowerCase()
          : "";

      const matchSearch =
        query === "" || name.includes(query) || jpName.includes(query);

      const matchFilter =
        activeFilter === "All" || character.type === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [search, activeFilter]);

  return (
    <section className="characters-page">
      <GameCard className="page-control-card characters-page-card">
        <SectionHeader
          title="Characters"
          kicker="Stable Roster"
          action={<Badge>{filteredCharacters.length} entries</Badge>}
        />

        <div className="characters-toolbar">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search character..."
          />

          <FilterTabs
            items={filters}
            value={activeFilter}
            onChange={setActiveFilter}
            className="characters-filters"
          />
        </div>
      </GameCard>

      

      {filteredCharacters.length === 0 ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>No characters found</strong>
              <span>Try a different name or roster filter.</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : (
        <StaggerContainer
          className="characters-grid"
          key={`${activeFilter}-${search}`}
        >
          {filteredCharacters.map((character) => (
          <StaggerItem
            as="article"
            className="ui-game-card character-card"
            key={character.id}
          >
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
                <Badge>{character.type}</Badge>
                {/* <button type="button">View</button> */}
              </div>
            </div>
          </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </section>
  );
}
