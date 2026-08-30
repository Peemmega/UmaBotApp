import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import "../../styles/charactersPage.css";
import { Badge, FilterTabs, GameCard, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { DEFAULT_AVATAR_URL, toAbsoluteBotUrl } from "../../utils/avatar";
import { BOT_API_BASE } from "../../api/playerApi";
import { APP_BASE_URL } from "../../api/appConfig";
import { PROFILE_TYPES } from "../../data/profilePresets";
import { aptitudeRows } from "../../data/dashboardConfig";
import AptitudeItem from "../../components/AptitudeItem";
import RaceHistoryDetailModal from "../../components/RaceHistoryDetailModal";
import { playSound } from "../../utils/soundManager";

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
  return record?.race_name || record?.stage_name || record?.race?.name || record?.name || record?.track_name || "Unknown race";
}

function raceTrack(record) {
  const track = record?.track || record?.track_type || record?.surface || record?.race?.track || "-";
  return record?.record_type === "practice" ? `${track} · Practice` : track;
}

function racePlacement(record) {
  const place = record?.final_rank ?? record?.placement ?? record?.rank ?? record?.position ?? record?.place;
  return Number.isFinite(Number(place)) ? `#${place}` : "-";
}

function raceDate(record) {
  const value = record?.finished_at || record?.finishedAt || record?.date;
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

function raceScore(record) {
  const score = record?.final_score ?? record?.score;
  return Number.isFinite(Number(score)) ? new Intl.NumberFormat().format(Number(score)) : "-";
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
  const [selectedRaceResult, setSelectedRaceResult] = useState(null);
  const openCharacterProfile = (character) => {
    playSound("open");
    setSelectedRaceResult(null);
    setSelectedCharacter(character);
  };
  const closeCharacterProfile = () => {
    playSound("close");
    setSelectedRaceResult(null);
    setSelectedCharacter(null);
  };

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
              throw new Error(data?.detail || `การโหลดข้อมูลล้มเหลว: ${res.status}`);
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
          title="สมาชิก"
          kicker="สมุดรายชื่อ"
          action={<Badge>{filteredCharacters.length} รายชื่อ</Badge>}
        />

        <div className="characters-toolbar">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตัวละคร..."
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
              <strong>กำลังโหลดตัวละคร...</strong>
              <span>อ่านข้อมูลรายชื่อจากระบบ</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : loadError && rosterCharacters.length === 0 ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>ไม่สามารถโหลดตัวละครได้</strong>
              <span>{loadError}</span>
            </GameCard>
          </StaggerItem>
        </StaggerContainer>
      ) : filteredCharacters.length === 0 ? (
        <StaggerContainer>
          <StaggerItem>
            <GameCard className="page-empty-state">
              <strong>ไม่พบตัวละคร</strong>
              <span>ลองใช้ชื่ออื่นหรือตัวกรองรายชื่อผู้เล่นดู</span>
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
            onClick={() => openCharacterProfile(character)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCharacterProfile(character);
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
      {createPortal(
        <AnimatePresence>
          {selectedCharacter && <CharacterProfileModal
            character={selectedCharacter}
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onClose={closeCharacterProfile}
            onOpenCharacter={openCharacterProfile}
            onOpenRace={(record) => setSelectedRaceResult(record)}
          />}
        </AnimatePresence>,
        document.body
      )}
      {selectedRaceResult && createPortal(
        <RaceHistoryDetailModal
          raceId={selectedRaceResult.race_id}
          fallback={selectedRaceResult}
          onClose={() => setSelectedRaceResult(null)}
        />,
        document.body
      )}
    </section>
  );
}

function CharacterProfileModal({ character, detail, loading, error, onClose, onOpenCharacter, onOpenRace }) {
  const prefersReducedMotion = useReducedMotion();
  const [historyRecordType, setHistoryRecordType] = useState("all");
  const isTrainer = character.type === "Trainer";
  const profile = detail?.profile || character.profileData || {};
  const imageUrl = profile.profile_image_url || profile.image_url || character.image_url;
  const name = profile.username || profile.name || character.name;
  const traineeTrainer = detail?.related?.trainer;
  const filteredRaceHistory = useMemo(
    () => (detail?.history || []).filter((record) => (
      historyRecordType === "all" || record.record_type === historyRecordType
    )),
    [detail?.history, historyRecordType]
  );

  useEffect(() => {
    setHistoryRecordType("all");
  }, [character.id]);
  const members = detail?.related?.members || [];
  const fans = isTrainer ? (detail?.related?.fans ?? profile.fans) : profile.fans;

  useEffect(() => {
    const handleEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <motion.div
      className="character-profile-backdrop"
      role="presentation"
      onMouseDown={onClose}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.section
        className={`character-profile-modal ${isTrainer ? "character-profile-modal--trainer" : "character-profile-modal--trainee"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="character-profile-title"
        onMouseDown={(event) => event.stopPropagation()}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 26, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 330, damping: 27 }}
      >
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

        {loading ? <p className="character-profile-status">กำลังโหลดโปรไฟล์...</p> : error ? <p className="character-profile-status is-error">{error}</p> : isTrainer ? (
          <section className="character-profile-section">
            <h3>สาวม้าในทีม</h3>
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
            ))}</div> : <p className="character-profile-empty">ยังไม่มีสาวม้าในทีม</p>}
          </section>
        ) : (
          <>
            {traineeTrainer && <button type="button" className="character-profile-trainer" onClick={() => onOpenCharacter({
              id: traineeTrainer.user_id || traineeTrainer.id,
              name: traineeTrainer.username || traineeTrainer.name,
              image_url: traineeTrainer.image_url,
              type: "Trainer",
            })}><img src={toAbsoluteBotUrl(traineeTrainer.image_url) || DEFAULT_AVATAR_URL} alt={traineeTrainer.username} /><span>เทรนเนอร์</span><strong>{traineeTrainer.username || traineeTrainer.name}</strong></button>}
            <section className="character-profile-section">
              <h3>ค่าความถนัด</h3>
              <div className="character-aptitude-grid">
                {aptitudeRows.map((row) => <div className="character-aptitude-group" key={row.title}><span>{row.title}</span><div>{row.items.map((item) => <AptitudeItem key={item.key} label={item.label} value={profile[item.key]} />)}</div></div>)}
              </div>
            </section>
            <section className="character-profile-section">
              <div className="character-profile-section-heading">
                <h3>ประวัติการแข่ง ({filteredRaceHistory.length})</h3>
                <label className="character-race-record-filter">
                  <span>ประเภท</span>
                  <select
                    value={historyRecordType}
                    onChange={(event) => {
                      playSound("click");
                      setHistoryRecordType(event.target.value);
                    }}
                  >
                    <option value="all">All</option>
                    <option value="official">Official</option>
                    <option value="practice">Practice</option>
                  </select>
                </label>
              </div>
              {detail?.history?.length ? (filteredRaceHistory.length ? <div className="character-race-list" role="table" aria-label="Race history">
                <div className="character-race-row character-race-row--header" role="row">
                  <span>วันที่</span><span>รายการ</span><span>เทรนเนอร์</span><span>สายวิ่ง</span><span>อันดับ</span><span>คะแนน</span>
                </div>
                {filteredRaceHistory.map((record, index) => <button type="button" className="character-race-row character-race-row--button" role="row" key={record.race_id || record.id || `${raceName(record)}-${index}`} onClick={() => onOpenRace(record)}>
                  <time data-label="วันที่">{raceDate(record)}</time>
                  <span data-label="รายการ"><strong>{raceName(record)}</strong><em>{raceTrack(record)}</em></span>
                  <span data-label="เทรนเนอร์">{record.trainer_name || "-"}</span>
                  <span data-label="สายวิ่ง">{record.running_style || "-"}</span>
                  <strong data-label="อันดับ" className="character-race-placement">{racePlacement(record)}</strong>
                  <strong data-label="คะแนน">{raceScore(record)}</strong>
                </button>)}
              </div> : <p className="character-profile-empty">ไม่พบประวัติการแข่งขันตามประเภทที่เลือก</p>) : <p className="character-profile-empty">ยังไม่มีประวัติการแข่งขัน</p>}
            </section>
          </>
        )}
      </motion.section>
    </motion.div>
  );
}
