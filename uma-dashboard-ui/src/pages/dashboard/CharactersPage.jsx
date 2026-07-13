import { useEffect, useMemo, useState } from "react";
import "../../styles/charactersPage.css";
import { Badge, FilterTabs, GameCard, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { DEFAULT_AVATAR_URL, toAbsoluteBotUrl } from "../../utils/avatar";
import { BOT_API_BASE } from "../../api/playerApi";
import { APP_BASE_URL } from "../../api/appConfig";
import { PROFILE_TYPES } from "../../data/profilePresets";

const APP_API_BASE = APP_BASE_URL;

const CHARACTER_SUMMARY_SOURCES = [
  BOT_API_BASE,
  APP_API_BASE,
];

function getCharacterType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "trainer") return PROFILE_TYPES.trainer.label;
  if (normalized === "npc") return PROFILE_TYPES.npc.label;
  return "Umamusume (Trainee)";
}

function getCharacterBadgeClass(type) {
  if (type === "Trainer") return "profile-badge-trainer";
  if (type === "NPC") return "profile-badge-npc";
  return "profile-badge-trainee";
}

export default function CharactersPage({ userId, player, profiles }) {
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

  const profileCharacters = useMemo(() => {
    if (!profiles) return [];

    return Object.values(PROFILE_TYPES)
      .map((profileType) => {
        const profile = profiles[profileType.id];
        const imageUrl = profile?.imageUrl ||
          (profileType.id === "trainee" ? player?.profile_image_url : "");
        if (!imageUrl) return null;

        return {
          id: `${userId}:${profileType.id}`,
          name: profile?.name || player?.username || profileType.label,
          image_url: imageUrl,
          type: profileType.id === "trainee" ? "Umamusume (Trainee)" : profileType.label,
        };
      })
      .filter(Boolean);
  }, [player?.profile_image_url, player?.username, profiles, userId]);

  const rosterCharacters = useMemo(() => {
    const remoteProfiles = characters
      .filter((character) => String(character?.id || "") !== String(userId || ""))
      .filter((character) => Boolean(String(character?.image_url || "").trim()))
      .map((character) => ({ ...character, type: getCharacterType(character.type) }));

    const remoteIds = new Set(remoteProfiles.map((character) => String(character.id)));
    return [...remoteProfiles, ...profileCharacters.filter((character) => !remoteIds.has(String(character.id)))];
  }, [characters, profileCharacters, userId]);

  const filters = useMemo(() => {
    const types = Array.from(
      new Set(
        rosterCharacters
          .map((character) => String(character?.type || "").trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    return ["All", ...types];
  }, [rosterCharacters]);

  const filteredCharacters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rosterCharacters.filter((character) => {
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
  }, [activeFilter, rosterCharacters, search]);

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
      ) : loadError && rosterCharacters.length === 0 ? (
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
                <Badge className={getCharacterBadgeClass(character.type)}>{character.type}</Badge>
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
