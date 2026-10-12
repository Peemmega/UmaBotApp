import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import "../../styles/charactersPage.css";
import { Badge, FilterTabs, GameCard, Pagination, SearchInput, SectionHeader } from "../../components/ui";
import { StaggerContainer, StaggerItem } from "../../components/AnimatedStagger";
import { DEFAULT_AVATAR_URL, toAbsoluteBotUrl } from "../../utils/avatar";
import { BOT_API_BASE } from "../../api/playerApi";
import { APP_BASE_URL } from "../../api/appConfig";
import { PROFILE_TYPES } from "../../data/profilePresets";
import { aptitudeRows } from "../../data/dashboardConfig";
import AptitudeItem from "../../components/AptitudeItem";
import horseshoeIcon from "../../assets/icons/horseshoe.webp";
import RaceHistoryDetailModal from "../../components/RaceHistoryDetailModal";
import { playSound } from "../../utils/soundManager";

const APP_API_BASE = APP_BASE_URL;
const RACE_HISTORY_PAGE_SIZE = 6;
const aptitudeIcons = {
  turf: "🌿",
  dirt: "🟤",
  sprint: "🏁",
  mile: "🏇",
  medium: "🏇",
  long: "🏇",
  front: "»",
  pace: "»",
  late: "»",
  end_style: "»",
};

const CHARACTER_SUMMARY_SOURCES = [
  BOT_API_BASE,
  APP_API_BASE,
];

function getCharacterType(type) {
  const normalized = String(type || "").trim().toLowerCase();
  if (normalized === "trainer") return PROFILE_TYPES.trainer.label;
  if (normalized === "npc") return PROFILE_TYPES.npc.label;
  return "Umamusume";
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

function getSummaryAccountId(character) {
  return String(character?.id || "").split(":")[0];
}

function getSummaryProfileRole(character) {
  const idRole = String(character?.id || "").split(":")[1]?.toLowerCase();
  if (idRole === "trainer" || idRole === "npc" || idRole === "trainee") return idRole;
  const type = String(character?.type || "").trim().toLowerCase();
  if (type === "trainer" || type === "npc") return type;
  return "trainee";
}

async function keepCurrentRoleSummaries(profiles, ownUserId) {
  const grouped = new Map();
  for (const profile of profiles) {
    const accountId = getSummaryAccountId(profile);
    if (!accountId) continue;
    const group = grouped.get(accountId) || [];
    group.push(profile);
    grouped.set(accountId, group);
  }

  const duplicateIds = [...grouped.entries()]
    .filter(([accountId, group]) => group.length > 1 && accountId !== String(ownUserId || ""))
    .map(([accountId]) => accountId);
  const currentRoles = new Map(await Promise.all(duplicateIds.map(async (accountId) => {
    try {
      const response = await fetch(`${BOT_API_BASE}/account/${encodeURIComponent(accountId)}/role`);
      if (!response.ok) return [accountId, ""];
      const data = await response.json();
      const role = String(data?.role || "").toLowerCase();
      return [accountId, ["trainee", "trainer", "npc"].includes(role) ? role : ""];
    } catch {
      return [accountId, ""];
    }
  })));

  const keptIds = new Set();
  return profiles.filter((profile) => {
    const accountId = getSummaryAccountId(profile);
    const group = grouped.get(accountId) || [];
    let keep = true;
    if (group.length > 1 && accountId !== String(ownUserId || "")) {
      const role = currentRoles.get(accountId);
      const matchingProfile = role
        ? group.find((candidate) => getSummaryProfileRole(candidate) === role)
        : group.find((candidate) => getSummaryProfileRole(candidate) === "trainee") || group[0];
      keep = profile === matchingProfile;
    }
    const uniqueId = String(profile?.id || `${accountId}:${getSummaryProfileRole(profile)}`);
    if (!keep || keptIds.has(uniqueId)) return false;
    keptIds.add(uniqueId);
    return true;
  });
}

function raceName(record) {
  return record?.race_name || record?.stage_name || record?.race?.name || record?.name || record?.track_name || "Unknown race";
}

function raceTrack(record) {
  const track = record?.track || record?.track_type || record?.race?.track || "-";
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
  return new Intl.DateTimeFormat("th-TH-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function raceScore(record) {
  const score = record?.final_score ?? record?.score;
  return Number.isFinite(Number(score)) ? new Intl.NumberFormat().format(Number(score)) : "-";
}

const EMPTY_BASIC_PROFILE = {
  self_intro: "", name_th: "", name_en: "", division: "", birthday_day: "",
  birthday_month: "", height_cm: "", dorm: "", likes: "", dislikes: "",
  personality: "", biography: "", additional: "",
};

function basicProfileIsComplete(profile) {
  return Boolean(profile?.name_th && profile?.name_en && profile?.division && profile?.birthday_day && profile?.birthday_month && profile?.height_cm && profile?.dorm);
}

function birthdayLabel(profile) {
  if (!profile?.birthday_day || !profile?.birthday_month) return "—";
  return `${String(profile.birthday_day).padStart(2, "0")}/${String(profile.birthday_month).padStart(2, "0")}`;
}

function countWords(value) {
  const text = String(value || "").trim();
  if (!text) return 0;
  if (typeof Intl.Segmenter === "function") {
    return Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text))
      .filter((part) => part.isWordLike).length;
  }
  return text.split(/\s+/).length;
}

function BasicProfileSection({ userId, character, initialProfile, loading, onUpdated }) {
  const characterOwnerId = String(character.userId || character.id || "").split(":")[0];
  const isOwner = character.type === "Umamusume" && characterOwnerId === String(userId || "");
  const [profile, setProfile] = useState({ ...EMPTY_BASIC_PROFILE });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = { ...EMPTY_BASIC_PROFILE, ...(initialProfile || {}) };
    for (const field of ["birthday_day", "birthday_month", "height_cm"]) {
      next[field] = next[field] == null ? "" : String(next[field]);
    }
    setProfile(next);
    setEditing(isOwner && !basicProfileIsComplete(next));
    setSaved(false);
    setError("");
  }, [character.id, initialProfile, isOwner]);

  const change = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!basicProfileIsComplete(profile)) {
      setError("กรอกชื่อทั้งสองภาษา ชั้นปี วันเกิด ส่วนสูง และหอก่อนบันทึก");
      return;
    }
    if (countWords(profile.likes) > 60 || countWords(profile.dislikes) > 60 || countWords(profile.personality) > 200 || countWords(profile.biography) > 200 || countWords(profile.additional) > 200) {
      setError("Like และ Dislike จำกัด 60 คำ ส่วนบุคลิก ประวัติ และเพิ่มเติมจำกัดอย่างละ 200 คำ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BOT_API_BASE}/player/${encodeURIComponent(characterOwnerId)}/basic-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          birthday_day: Number(profile.birthday_day),
          birthday_month: Number(profile.birthday_month),
          height_cm: Number(profile.height_cm),
          word_counts: Object.fromEntries(["likes", "dislikes", "personality", "biography", "additional"].map((field) => [field, countWords(profile[field])])),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "บันทึกข้อมูลไม่สำเร็จ");
      const next = { ...EMPTY_BASIC_PROFILE, ...(data.profile || profile) };
      for (const field of ["birthday_day", "birthday_month", "height_cm"]) next[field] = String(next[field] ?? "");
      setProfile(next);
      setEditing(false);
      setSaved(true);
      onUpdated?.(data.profile || profile);
    } catch (requestError) {
      setError(String(requestError.message || requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="basic-profile-card" aria-labelledby="basic-profile-title">
      <div className="basic-profile-heading">
        <div><span className="basic-profile-kicker">CHARACTER FILE</span><h3 id="basic-profile-title">ข้อมูลพื้นฐาน</h3></div>
        {isOwner && !editing && <button type="button" className="basic-profile-edit" onClick={() => { setEditing(true); setSaved(false); }}><Pencil size={15} /> แก้ไขข้อมูล</button>}
      </div>
      {loading ? <p className="basic-profile-note">กำลังโหลดข้อมูลพื้นฐาน…</p> : editing ? (
        <form className="basic-profile-form" onSubmit={submit}>
          <label className="basic-profile-field basic-profile-field--wide"><span>Self-Intro <small>{profile.self_intro.length}/100 ตัวอักษร</small></span><textarea maxLength={100} rows={2} value={profile.self_intro} onChange={change("self_intro")} /></label>
          <label className="basic-profile-field"><span>ชื่อภาษาไทย <b>*</b></span><input required maxLength={80} value={profile.name_th} onChange={change("name_th")} /></label>
          <label className="basic-profile-field"><span>ชื่อภาษาอังกฤษ <b>*</b></span><input required maxLength={80} value={profile.name_en} onChange={change("name_en")} /></label>
          <label className="basic-profile-field"><span>Class <b>*</b></span><select required value={profile.division} onChange={change("division")}><option value="">เลือก Division</option><option>Junior Division</option><option>Senior Division</option></select></label>
          <label className="basic-profile-field"><span>Birthday <b>*</b></span><div className="basic-profile-birthday"><select required aria-label="วันเกิด" value={profile.birthday_day} onChange={change("birthday_day")}><option value="">วัน</option>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select><span>/</span><select required aria-label="เดือนเกิด" value={profile.birthday_month} onChange={change("birthday_month")}><option value="">เดือน</option>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, "0")}</option>)}</select></div></label>
          <label className="basic-profile-field"><span>Height (cm.) <b>*</b></span><input required type="number" min="1" max="300" value={profile.height_cm} onChange={change("height_cm")} /></label>
          <label className="basic-profile-field"><span>Dorm <b>*</b></span><select required value={profile.dorm} onChange={change("dorm")}><option value="">เลือกหอพัก</option><option>Ritto</option><option>Miho</option></select></label>
          <label className="basic-profile-field"><span>Like <small>{countWords(profile.likes)}/60 คำ</small></span><textarea rows={2} value={profile.likes} onChange={change("likes")} /></label>
          <label className="basic-profile-field"><span>Dislike <small>{countWords(profile.dislikes)}/60 คำ</small></span><textarea rows={2} value={profile.dislikes} onChange={change("dislikes")} /></label>
          <label className="basic-profile-field basic-profile-field--wide"><span>บุคลิก <small>{countWords(profile.personality)}/200 คำ</small></span><textarea rows={3} value={profile.personality} onChange={change("personality")} /></label>
          <label className="basic-profile-field basic-profile-field--wide"><span>ประวัติ <small>{countWords(profile.biography)}/200 คำ</small></span><textarea rows={5} value={profile.biography} onChange={change("biography")} /></label>
          <label className="basic-profile-field basic-profile-field--wide"><span>เพิ่มเติม <small>{countWords(profile.additional)}/200 คำ</small></span><textarea rows={3} value={profile.additional} onChange={change("additional")} /></label>
          {error && <p className="basic-profile-error basic-profile-field--wide">{error}</p>}
          <div className="basic-profile-actions basic-profile-field--wide"><button type="submit" disabled={saving}><Save size={16} /> {saving ? "กำลังบันทึก…" : "บันทึกข้อมูล"}</button>{basicProfileIsComplete(initialProfile) && <button type="button" className="basic-profile-cancel" onClick={() => { setProfile({ ...EMPTY_BASIC_PROFILE, ...initialProfile }); setEditing(false); setError(""); }}><X size={16} /> ยกเลิก</button>}</div>
        </form>
      ) : basicProfileIsComplete(profile) ? <>
        {profile.self_intro && <p className="basic-profile-intro">“{profile.self_intro}”</p>}
        <div className="basic-profile-overview">
          <div className="basic-profile-main-column">
            <article className="basic-profile-personality"><h4>บุคลิก</h4><p>{profile.personality || "ยังไม่ได้ระบุ"}</p></article>
            <article className="basic-profile-narrative"><h4>ประวัติ</h4><p>{profile.biography || "ยังไม่ได้ระบุ"}</p></article>
          </div>
          <div className="basic-profile-sidebar">
            <dl className="basic-profile-details">
              <div><dt>ชื่อ</dt><dd>{profile.name_th}</dd></div>
              <div><dt>Name</dt><dd>{profile.name_en}</dd></div>
              <div><dt>Birthday</dt><dd>{birthdayLabel(profile)}</dd></div>
              <div><dt>Height</dt><dd>{profile.height_cm} cm.</dd></div>
              <div><dt>Class</dt><dd>{profile.division}</dd></div>
              <div><dt>Dorm</dt><dd>{profile.dorm}</dd></div>
              <div><dt>Like</dt><dd>{profile.likes || "—"}</dd></div>
              <div><dt>Dislike</dt><dd>{profile.dislikes || "—"}</dd></div>
            </dl>
            <article className="basic-profile-narrative basic-profile-additional"><h4>เพิ่มเติม</h4><p>{profile.additional || "ยังไม่ได้ระบุ"}</p></article>
          </div>
        </div>
        {saved && <p className="basic-profile-saved">บันทึกข้อมูลแล้ว</p>}
      </> : <div className="basic-profile-empty"><strong>{isOwner ? "เริ่มสร้าง Character File ของคุณ" : "เจ้าของยังไม่ได้ตั้งข้อมูลพื้นฐาน"}</strong><p>{isOwner ? "กรอกข้อมูลหลักเพื่อให้ผู้เข้าชมเห็นโปรไฟล์ตัวละครนี้" : "ข้อมูลจะแสดงที่นี่เมื่อเจ้าของโปรไฟล์ตั้งค่าเรียบร้อย"}</p>{isOwner && <button type="button" className="basic-profile-edit" onClick={() => setEditing(true)}><Pencil size={15} /> ตั้งค่าข้อมูลพื้นฐาน</button>}</div>}
    </section>
  );
}

export default function CharactersPage({ userId, player, profiles, activeProfileType = "trainee", characterRoute, onOpenCharacter, onBack }) {
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

  useEffect(() => {
    const closeOverlays = () => {
      setSelectedRaceResult(null);
    };
    window.addEventListener("uma:close-overlays", closeOverlays);
    return () => window.removeEventListener("uma:close-overlays", closeOverlays);
  }, []);

  const openCharacterProfile = (character) => {
    playSound("open");
    setSelectedRaceResult(null);
    onOpenCharacter?.(character);
  };
  const closeCharacterProfile = () => {
    playSound("close");
    setSelectedRaceResult(null);
    onBack?.();
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

            const summaries = Array.isArray(data?.players) ? data.players : [];
            const currentRoleSummaries = await keepCurrentRoleSummaries(summaries, userId);
            if (!cancelled) {
              setCharacters(currentRoleSummaries);
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
          requests.push(fetch(`${BOT_API_BASE}/player/${encodeURIComponent(characterId)}/basic-profile`).then((res) => res.ok ? res.json() : null));
        }

        const [profile, related, history, basicProfile] = await Promise.all(requests);
        if (!cancelled) {
          setDetail({ profile: profile || selectedCharacter.profileData || {}, related, history: normalizeRaceHistory(history), basicProfile: basicProfile?.profile || null });
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
      .filter((profileType) => profileType.id === activeProfileType)
      .map((profileType) => {
        const profile = profiles[profileType.id];
        const imageUrl = profile?.imageUrl ||
          (profileType.id === "trainee" ? player?.profile_image_url : "");
        return {
          id: `${userId}:${profileType.id}`,
          userId,
          profileData: player || {},
          name: profile?.name || player?.username || profileType.label,
          image_url: imageUrl,
          type: profileType.id === "trainee" ? "Umamusume" : profileType.label,
        };
      })
      .filter(Boolean);
  }, [activeProfileType, player?.profile_image_url, player?.username, profiles, userId]);

  const rosterCharacters = useMemo(() => {
    const remoteProfiles = characters
      .filter((character) => String(character?.id || "").split(":")[0] !== String(userId || ""))
      .filter((character) => Boolean(String(character?.image_url || "").trim()))
      .map((character) => ({ ...character, type: getCharacterType(character.type) }));

    const remoteIds = new Set(remoteProfiles.map((character) => String(character.id)));
    return [...remoteProfiles, ...profileCharacters.filter((character) => !remoteIds.has(String(character.id)))];
  }, [characters, profileCharacters, userId]);

  const routeCharacter = characterRoute?.character || rosterCharacters.find((character) => (
    String(character.id) === String(characterRoute?.id) && character.type === characterRoute?.type
  )) || null;

  useEffect(() => {
    if (!characterRoute) {
      setSelectedCharacter(null);
      return;
    }
    if (routeCharacter) setSelectedCharacter(routeCharacter);
    else if (!loading) setSelectedCharacter(null);
  }, [characterRoute, loading, routeCharacter]);

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
      {characterRoute ? routeCharacter ? <CharacterProfilePage
        character={routeCharacter}
        userId={userId}
        onBasicProfileUpdated={(basicProfile) => setDetail((current) => current ? { ...current, basicProfile } : current)}
        detail={selectedCharacter?.id === routeCharacter.id ? detail : null}
        loading={selectedCharacter?.id !== routeCharacter.id || detailLoading || (!detail && !detailError)}
        error={detailError}
        onClose={closeCharacterProfile}
        onOpenCharacter={openCharacterProfile}
        onOpenRace={(record) => setSelectedRaceResult(record)}
      /> : <GameCard className="page-empty-state character-route-state">
        <strong>{loading ? "กำลังโหลดตัวละคร..." : "ไม่พบตัวละครนี้"}</strong>
        <button type="button" onClick={closeCharacterProfile}>กลับไปสมุดรายชื่อ</button>
      </GameCard> : <>
      <GameCard className="page-control-card characters-page-card">
        <SectionHeader
          level={1}
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
                loading="lazy"
                decoding="async"
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
      </>}
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

function CharacterProfilePage({ character, userId, detail, loading, error, onClose, onOpenCharacter, onOpenRace, onBasicProfileUpdated }) {
  const prefersReducedMotion = useReducedMotion();
  const [historyRecordType, setHistoryRecordType] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);
  const isTrainer = character.type === "Trainer";
  const profileTheme = character.type === "Trainer"
    ? "trainer"
    : character.type === "NPC" ? "npc" : "trainee";
  const profile = detail?.profile || character.profileData || {};
  // /player/{id} always returns the account's trainee record. For Trainer/NPC
  // cards that would replace the role-specific identity shown in the roster.
  const usesPresetIdentity = character.type === "Trainer" || character.type === "NPC";
  const imageUrl = usesPresetIdentity
    ? character.image_url || profile.image_url || profile.profile_image_url
    : profile.profile_image_url || profile.image_url || character.image_url;
  const name = usesPresetIdentity
    ? character.name || profile.name || profile.username
    : detail?.basicProfile?.name_th || profile.username || profile.name || character.name;
  const traineeTrainer = detail?.related?.trainer;
  const filteredRaceHistory = useMemo(
    () => (detail?.history || []).filter((record) => (
      historyRecordType === "all" || record.record_type === historyRecordType
    )),
    [detail?.history, historyRecordType]
  );
  const historyPageCount = Math.max(
    1,
    Math.ceil(filteredRaceHistory.length / RACE_HISTORY_PAGE_SIZE)
  );
  const paginatedRaceHistory = useMemo(() => {
    const firstRecord = (historyPage - 1) * RACE_HISTORY_PAGE_SIZE;
    return filteredRaceHistory.slice(firstRecord, firstRecord + RACE_HISTORY_PAGE_SIZE);
  }, [filteredRaceHistory, historyPage]);

  useEffect(() => {
    setHistoryRecordType("all");
    setHistoryPage(1);
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
      className={`character-profile-page profile-theme-${profileTheme} profile-theme-portal`}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <button type="button" className="character-profile-page-back" onClick={onClose}>
        <ArrowLeft size={18} aria-hidden="true" /> กลับไปสมุดรายชื่อ
      </button>
      <motion.section
        className={`character-profile-modal ${isTrainer ? "character-profile-modal--trainer" : "character-profile-modal--trainee"}`}
        aria-labelledby="character-profile-title"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 330, damping: 27 }}
      >
        <header className="character-profile-hero">
          <img src={toAbsoluteBotUrl(imageUrl) || DEFAULT_AVATAR_URL} alt={name} />
          <div>
            <Badge className={getCharacterBadgeClass(character.type)}>{character.type}</Badge>
            <h2 id="character-profile-title">{name}</h2>
            <p>{isTrainer ? "Trainer profile" : detail?.basicProfile?.name_en || "Umamusume trainee profile"}</p>
          </div>
          <div className="character-profile-fans"><span>{isTrainer ? "Total Fans" : "Fans Point"}</span><strong>{formatFans(fans)}</strong></div>
        </header>

        {!isTrainer && <BasicProfileSection userId={userId} character={character} initialProfile={detail?.basicProfile} loading={loading} onUpdated={onBasicProfileUpdated} />}

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
                  type: "Umamusume",
                })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenCharacter({ id: member.user_id || member.id, name: member.username || member.name, image_url: member.image_url, type: "Umamusume" });
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
              <h3 className="character-aptitude-title"><img src={horseshoeIcon} alt="" />ค่าความถนัด</h3>
              <div className="aptitude-table character-aptitude-table">
                {aptitudeRows.map((row) => (
                  <div className="aptitude-row" key={row.title}>
                    <div className="aptitude-row-title">{row.title}</div>
                    <div className="aptitude-row-items">
                      {row.items.map((item) => (
                        <AptitudeItem key={item.key} label={item.label} value={profile[item.key]} icon={aptitudeIcons[item.key]} />
                      ))}
                    </div>
                  </div>
                ))}
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
                      setHistoryPage(1);
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
                {paginatedRaceHistory.map((record, index) => <button type="button" className="character-race-row character-race-row--button" role="row" key={record.race_id || record.id || `${raceName(record)}-${index}`} onClick={() => onOpenRace(record)}>
                  <time data-label="วันที่">{raceDate(record)}</time>
                  <span data-label="รายการ"><strong>{raceName(record)}</strong><em>{raceTrack(record)}</em></span>
                  <span data-label="เทรนเนอร์">{record.trainer_name || "-"}</span>
                  <span data-label="สายวิ่ง">{record.running_style || "-"}</span>
                  <strong data-label="อันดับ" className="character-race-placement">{racePlacement(record)}</strong>
                  <strong data-label="คะแนน">{raceScore(record)}</strong>
                </button>)}
                <Pagination
                  page={historyPage}
                  pageCount={historyPageCount}
                  onPageChange={setHistoryPage}
                  label="ประวัติการแข่งขัน"
                />
              </div> : <p className="character-profile-empty">ไม่พบประวัติการแข่งขันตามประเภทที่เลือก</p>) : <p className="character-profile-empty">ยังไม่มีประวัติการแข่งขัน</p>}
            </section>
          </>
        )}
      </motion.section>
    </motion.div>
  );
}
