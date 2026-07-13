import { useEffect, useMemo, useState } from "react";
import "../../styles/charactersPage.css";
import { Badge, FilterTabs, GameCard, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { DEFAULT_AVATAR_URL, toAbsoluteBotUrl } from "../../utils/avatar";
import { BOT_API_BASE } from "../../api/playerApi";
import { APP_BASE_URL } from "../../api/appConfig";

const APP_API_BASE = APP_BASE_URL;

const CHARACTER_SUMMARY_SOURCES = [
  BOT_API_BASE,
  APP_API_BASE,
];

export default function CharactersPage() {
  const [search, setSearch] = useState("");
  const [characters, setCharacters] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCharacters() {
      const failures = [];

      try {
        setLoading(true);
        setLoadError("");

        for (const baseUrl of CHARACTER_SUMMARY_SOURCES) {
          const summaryUrl = `${String(baseUrl || "").replace(/\/$/, "")}/api/players/summary`;

          try {
            const res = await fetch(summaryUrl);
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              throw new Error(data?.detail || `Character load failed: ${res.status}`);
            }

            if (!cancelled) {
              setCharacters(Array.isArray(data?.players) ? data.players : []);
            }
            return;
          } catch (error) {
            failures.push(`${summaryUrl}: ${String(error)}`);
          }
        }

        throw new Error(failures.join(" | "));
      } catch (error) {
        if (!cancelled) {
          setLoadError(String(error));
          setCharacters([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCharacters();

    return () => {
      cancelled = true;
    };
  }, []);

  const filters = useMemo(() => {
    const types = Array.from(
      new Set(
        characters
          .map((character) => String(character?.type || "").trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    return ["All", ...types];
  }, [characters]);

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
  }, [activeFilter, characters, search]);

  return (
    <section className="characters-page">
      <GameCard className="page-control-card characters-page-card">
        <SectionHeader
          title="Characters"
          kicker="System Roster"
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

      {loading ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>Loading characters...</strong>
              <span>Reading roster data from the system.</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : loadError ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>Unable to load characters</strong>
              <span>{loadError}</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : filteredCharacters.length === 0 ? (
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
            key={character.id || character.name}
          >
            <div className="character-image-frame">
              <img
                src={toAbsoluteBotUrl(character.image_url) || DEFAULT_AVATAR_URL}
                alt={character.name}
              />
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
