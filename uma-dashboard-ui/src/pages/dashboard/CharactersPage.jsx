import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "../../styles/charactersPage.css";
import { Badge, FilterTabs, GameCard, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { DEFAULT_AVATAR_URL, toAbsoluteBotUrl } from "../../utils/avatar";
import { BOT_API_BASE } from "../../api/playerApi";
import { APP_BASE_URL } from "../../api/appConfig";
import { PROFILE_TYPES } from "../../data/profilePresets";
import { aptitudeRows } from "../../data/dashboardConfig";
import AptitudeItem from "../../components/AptitudeItem";

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

function formatFans(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function normalizeRaceHistory(data) {
  const records = data?.races || data?.history || data?.results || data?.records || [];
  return Array.isArray(records) ? records : [];
}

function raceName(record) {
  return record?.race_name || record?.race?.name || record?.name || record?.track_name || "Unknown race";
}

function raceTrack(record) {
  return record?.track || record?.track_type || record?.surface || record?.race?.track || "-";
}

function racePlacement(record) {
  const place = record?.placement ?? record?.rank ?? record?.position ?? record?.place;
  return Number.isFinite(Number(place)) ? `#${place}` : "-";
}

export default function CharactersPage({ userId, player, profiles }) {
  const [search, setSearch] = useState("");
  const [characters, setCharacters] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

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

  useEffect(() => {
    if (!selectedCharacter) return undefined;

    let cancelled = false;
    const characterId = String(selectedCharacter.userId || selectedCharacter.id || "").split(":")[0];
    const isTrainer = selectedCharacter.type === "Trainer";

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError("");
      setDetail(null);

      try {
        const profileUrl = `${BOT_API_BASE}/player/${encodeURIComponent(characterId)}?username=${encodeURIComponent(selectedCharacter.name || "Unknown")}`;
        const requests = [fetch(profileUrl).then((res) => res.ok ? res.json() : null)];

        if (isTrainer) {
          requests.push(fetch(`${BOT_API_BASE}/trainer/${encodeURIComponent(characterId)}/team`).then((res) => res.ok ? res.json() : null));
        } else {
          requests.push(fetch(`${BOT_API_BASE}/trainee/${encodeURIComponent(characterId)}/trainer`).then((res) => res.ok ? res.json() : null));
          requests.push(fetch(`${BOT_API_BASE}/player/${encodeURIComponent(characterId)}/race-history`).then((res) => res.ok ? res.json() : null));
        }

        const [profile, related, history] = await Promise.all(requests);
        if (!cancelled) {
          setDetail({ profile: profile || selectedCharacter.profileData || {}, related, history: normalizeRaceHistory(history) });
        }
      } catch (error) {
        if (!cancelled) setDetailError("Could not load all profile details.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [selectedCharacter]);

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
          userId,
          profileData: player || {},
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
            role="button"
            tabIndex={0}
            onClick={() => setSelectedCharacter(character)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedCharacter(character);
              }
            }}
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
      {selectedCharacter && createPortal(
        <CharacterProfileModal
          character={selectedCharacter}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setSelectedCharacter(null)}
          onOpenCharacter={setSelectedCharacter}
        />,
        document.body
      )}
    </section>
  );
}

function CharacterProfileModal({ character, detail, loading, error, onClose, onOpenCharacter }) {
  const isTrainer = character.type === "Trainer";
  const profile = detail?.profile || character.profileData || {};
  const imageUrl = profile.profile_image_url || profile.image_url || character.image_url;
  const name = profile.username || profile.name || character.name;
  const traineeTrainer = detail?.related?.trainer;
  const members = detail?.related?.members || [];
  const fans = isTrainer ? (detail?.related?.fans ?? profile.fans) : profile.fans;

  useEffect(() => {
    const handleEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="character-profile-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="character-profile-modal" role="dialog" aria-modal="true" aria-labelledby="character-profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="character-profile-close" onClick={onClose} aria-label="Close profile">×</button>
        <header className="character-profile-hero">
          <img src={toAbsoluteBotUrl(imageUrl) || DEFAULT_AVATAR_URL} alt={name} />
          <div>
            <Badge className={getCharacterBadgeClass(character.type)}>{character.type}</Badge>
            <h2 id="character-profile-title">{name}</h2>
            <p>{isTrainer ? "Trainer profile" : "Umamusume trainee profile"}</p>
          </div>
          <div className="character-profile-fans"><span>{isTrainer ? "Total Fans" : "Fans Point"}</span><strong>{formatFans(fans)}</strong></div>
        </header>

        {loading ? <p className="character-profile-status">Loading profile details...</p> : error ? <p className="character-profile-status is-error">{error}</p> : isTrainer ? (
          <section className="character-profile-section">
            <h3>Trainees in team</h3>
            {members.length ? <div className="character-team-grid">{members.map((member) => (
              <article
                key={member.user_id || member.id || member.username}
                className="character-modal-team-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpenCharacter({
                  id: member.user_id || member.id,
                  name: member.username || member.name,
                  image_url: member.image_url,
                  type: "Umamusume (Trainee)",
                })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenCharacter({ id: member.user_id || member.id, name: member.username || member.name, image_url: member.image_url, type: "Umamusume (Trainee)" });
                  }
                }}
              >
                <div className="character-modal-team-image"><img src={toAbsoluteBotUrl(member.image_url) || DEFAULT_AVATAR_URL} alt={member.username} /></div>
                <div className="character-modal-team-info"><strong>{member.username || member.name}</strong><span>{formatFans(member.fans)} Fans</span></div>
              </article>
            ))}</div> : <p className="character-profile-empty">No Trainees in this team yet.</p>}
          </section>
        ) : (
          <>
            {traineeTrainer && <button type="button" className="character-profile-trainer" onClick={() => onOpenCharacter({
              id: traineeTrainer.user_id || traineeTrainer.id,
              name: traineeTrainer.username || traineeTrainer.name,
              image_url: traineeTrainer.image_url,
              type: "Trainer",
            })}><img src={toAbsoluteBotUrl(traineeTrainer.image_url) || DEFAULT_AVATAR_URL} alt={traineeTrainer.username} /><span>Trainer</span><strong>{traineeTrainer.username || traineeTrainer.name}</strong></button>}
            <section className="character-profile-section">
              <h3>Aptitude</h3>
              <div className="character-aptitude-grid">
                {aptitudeRows.map((row) => <div className="character-aptitude-group" key={row.title}><span>{row.title}</span><div>{row.items.map((item) => <AptitudeItem key={item.key} label={item.label} value={profile[item.key]} />)}</div></div>)}
              </div>
            </section>
            <section className="character-profile-section">
              <h3>Race history</h3>
              {detail?.history?.length ? <div className="character-race-list">{detail.history.map((record, index) => <div className="character-race-row" key={record.id || `${raceName(record)}-${index}`}><strong>{racePlacement(record)}</strong><span>{raceName(record)}</span><em>{raceTrack(record)}</em></div>)}</div> : <p className="character-profile-empty">No race history recorded yet.</p>}
            </section>
          </>
        )}
      </section>
    </div>
  );
}
