import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bot,
  ChevronUp,
  DoorOpen,
  Flag,
  Gauge,
  Heart,
  Map as MapIcon,
  Music2,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import {
  addRaceBot,
  confirmRaceTurn,
  createRaceRoom,
  getRaceRoom,
  joinRaceRoom,
  leaveRaceRoom,
  listRaceRooms,
  listRaceStages,
  rerollRaceTurn,
  runRaceTurn,
  startRaceRoom,
  submitRaceTiming,
  useRaceBlock,
  useRaceRush,
  useRaceSkill,
  useRaceZone,
  witRerollRaceTurn,
  RACE_API_BASE,
} from "../../api/raceApi";
import useRaceSocket from "../../hooks/useRaceSocket";
import { playSound } from "../../utils/soundManager";
import gutIcon from "../../assets/icons/Gut.webp";
import powerIcon from "../../assets/icons/Power.webp";
import speedIcon from "../../assets/icons/Speed.webp";
import staminaIcon from "../../assets/icons/Stamina.webp";
import witIcon from "../../assets/icons/Wit.webp";
import skillIcon from "../../assets/skill_icon/Velocity.webp";
import { getRaceImage } from "../../utils/raceSchedule.js";
import { getSkillIcon } from "../../utils/getSkillIcon";
import TimingRaceGauge from "../../components/TimingRaceGauge";
import "../../styles/raceGamePage.css";

const STYLE_OPTIONS = ["Front", "Pace", "Late", "End"];
const DICE_COLOR_OPTIONS = ["white", "gold"];
const RACE_STYLE_COOKIE = "uma_race_last_style";
const RACE_STYLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
const RACE_MUSIC_VOLUME_COOKIE = "uma_race_music_volume";
const RACE_MUSIC_VOLUME_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
const ROOKIE_BOT_IDS = [
  "rookie_front",
  "rookie_pace",
  "rookie_late",
  "rookie_end",
  "rookie_alt_front",
  "rookie_alt_pace",
  "rookie_alt_late",
  "rookie_alt_end",
];
const BOT_OPTIONS = [
  { id: "rookie_front", label: "Rookie Front" },
  { id: "rookie_pace", label: "Rookie Pace" },
  { id: "rookie_late", label: "Rookie Late" },
  { id: "rookie_end", label: "Rookie End" },
  { id: "rookie_alt_front", label: "Rookie Alt Front" },
  { id: "rookie_alt_pace", label: "Rookie Alt Pace" },
  { id: "rookie_alt_late", label: "Rookie Alt Late" },
  { id: "rookie_alt_end", label: "Rookie Alt End" },
  { id: "fujimasa_march", label: "Fujimasa March" },
  { id: "beyond_the_light", label: "Beyond The Light" },
  { id: "oguri_cap", label: "Oguri Cap" },
  { id: "obey_your_master", label: "Obey Your Master" },
  { id: "orfevre", label: "Orfevre" },
  { id: "gentildonna", label: "Gentildonna" },
  { id: "verxina", label: "Verxina" },
  { id: "still_in_love", label: "Still In Love" },
  { id: "special_week", label: "Special Week" },
  { id: "silecne_susuka", label: "Silecne Susuka" },
  { id: "almond_eye", label: "Almond Eye" },
  { id: "equinox", label: "Equinox" },
];

function normalizeRaceStyle(value) {
  const text = String(value || "").trim().toLowerCase();
  return STYLE_OPTIONS.find((item) => item.toLowerCase() === text) || "Pace";
}

function getCookieValue(name) {
  if (typeof document === "undefined") return "";
  const prefix = `${encodeURIComponent(name)}=`;
  const item = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

function saveRaceStyleCookie(value) {
  if (typeof document === "undefined") return;
  const style = normalizeRaceStyle(value);
  document.cookie = `${encodeURIComponent(RACE_STYLE_COOKIE)}=${encodeURIComponent(style)}; max-age=${RACE_STYLE_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function getSavedRaceStyle() {
  return normalizeRaceStyle(getCookieValue(RACE_STYLE_COOKIE));
}

function normalizeMusicVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.32;
  return Math.max(0, Math.min(1, number));
}

function saveRaceMusicVolumeCookie(value) {
  if (typeof document === "undefined") return;
  const volume = normalizeMusicVolume(value);
  document.cookie = `${encodeURIComponent(RACE_MUSIC_VOLUME_COOKIE)}=${encodeURIComponent(volume)}; max-age=${RACE_MUSIC_VOLUME_COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function getSavedRaceMusicVolume() {
  const value = getCookieValue(RACE_MUSIC_VOLUME_COOKIE);
  return value ? normalizeMusicVolume(value) : 0.32;
}

const BONUS_ICONS = {
  speed: speedIcon,
  power: powerIcon,
  stamina: staminaIcon,
  gut: gutIcon,
  wit: witIcon,
  skill: skillIcon,
};
const DISCORD_BONUS_ICON_MAP = {
  Speed: BONUS_ICONS.speed,
  Power: BONUS_ICONS.power,
  Stamina: BONUS_ICONS.stamina,
  Gut: BONUS_ICONS.gut,
  Guts: BONUS_ICONS.gut,
  Wit: BONUS_ICONS.wit,
  Wits: BONUS_ICONS.wit,
  Skill: BONUS_ICONS.skill,
};
const EFFECT_LABELS = {
  flat: "Pts",
  points: "Pts",
  score: "Pts",
  total: "Pts",
  add_d: "Dice",
  addDice: "Dice",
  dice: "Dice",
  add_kh: "Keep",
  keep_highest: "Keep",
  add_dkh: "Dice/Keep",
  floor: "Floor",
  cap: "Cap",
  selected: "Selected",
  gold_range: "Gold range",
  modify_current_speed: "Max speed",
  current_max_speed: "Max speed",
  max_speed: "Max speed",
  self_heal_stamina: "Stamina",
  heal_stamina: "Stamina",
  stamina: "Stamina",
  wit: "WIT",
  cooldown: "Cooldown",
};
const LOCAL_MOB_AVATAR_BY_ID = {
  rookie_front: "/mobs/rookie_front.webp",
  rookie_pace: "/mobs/rookie_pace.webp",
  rookie_late: "/mobs/rookie_late.webp",
  rookie_end: "/mobs/rookie_end.webp",
  rookie_alt_front: "/mobs/rookie_alt_front.webp",
  rookie_alt_pace: "/mobs/rookie_alt_pace.webp",
  rookie_alt_late: "/mobs/rookie_alt_late.webp",
  rookie_alt_end: "/mobs/rookie_alt_end.webp",
  fujimasa_march: "/mobs/fujimasa_march.webp",
  beyond_the_light: "/mobs/beyond_the_light.webp",
  oguri_cap: "/mobs/oguri_cap.webp",
  obey_your_master: "/mobs/obey_your_master.webp",
  orfevre: "/mobs/orfevre.webp",
  gentildonna: "/mobs/gentildonna.webp",
  verxina: "/mobs/verxina.webp",
  still_in_love: "/mobs/still_in_love.webp",
  special_week: "/mobs/special_week.webp",
  silecne_susuka: "/mobs/silecne_susuka.webp",
  almond_eye: "/mobs/almond_eye.webp",
  equinox: "/mobs/equinox.webp",
};
const LOCAL_MOB_AVATAR_BY_NAME = {
  "almond eye": "/mobs/almond_eye.webp",
  "apple cider": "/mobs/mob_01.webp",
  "beyond the light": "/mobs/beyond_the_light.webp",
  "dominant power": "/mobs/mob_03.webp",
  equinox: "/mobs/equinox.webp",
  "faster than ray": "/mobs/mob_01.webp",
  "fujimasa march": "/mobs/fujimasa_march.webp",
  gentildonna: "/mobs/gentildonna.webp",
  "hexa canyon": "/mobs/mob_03.webp",
  "obey your master": "/mobs/obey_your_master.webp",
  "oguri cap": "/mobs/oguri_cap.webp",
  orfevre: "/mobs/orfevre.webp",
  "sarasate opera": "/mobs/mob_02.webp",
  "shindo runrun": "/mobs/mob_02.webp",
  "silecnt susuka": "/mobs/silecne_susuka.webp",
  "silecne susuka": "/mobs/silecne_susuka.webp",
  "silence suzuka": "/mobs/silecne_susuka.webp",
  "sunfish ray": "/mobs/mob_04.webp",
  "special week": "/mobs/special_week.webp",
  "still in love": "/mobs/still_in_love.webp",
  verxina: "/mobs/verxina.webp",
  "waltz of shadow": "/mobs/mob_04.webp",
};
const LOCAL_MOB_AVATAR_FILES = new Set([
  "almond_eye.webp",
  "beyond_the_light.webp",
  "equinox.webp",
  "fujimasa_march.webp",
  "gentildonna.webp",
  "mob_01.webp",
  "mob_02.webp",
  "mob_03.webp",
  "mob_04.webp",
  "obey_your_master.webp",
  "oguri_cap.webp",
  "orfevre.webp",
  "rookie_alt_end.webp",
  "rookie_alt_front.webp",
  "rookie_alt_late.webp",
  "rookie_alt_pace.webp",
  "rookie_end.webp",
  "rookie_front.webp",
  "rookie_late.webp",
  "rookie_pace.webp",
  "silecne_susuka.webp",
  "special_week.webp",
  "still_in_love.webp",
  "verxina.webp",
]);
const RACE_STAGE_BG_BY_PATH_TYPE = {
  main: "/race_bg/main.webp",
  1: "/race_bg/path_1_bg.webp",
  2: "/race_bg/path_2_bg.webp",
  3: "/race_bg/path_3_bg.webp",
  4: "/race_bg/path_4_bg.webp",
  end: "/race_bg/path_end.webp",
};
const MAX_RACE_RANK_IMAGE_INDEX = 17;
const RACE_BGM_TRACKS = [
  "arima_kinen.mp3",
  "g1_race.mp3",
  "L'arc Trial Race.mp3",
  "アオハル杯 決勝.mp3",
  "ユメヲカケル -トレセン学園応援団 Ver-.mp3",
];
const ZONE_TRACKS = [
  "glorious_moment.mp3",
  "Last Spurt.mp3",
  "グランドマスターズ シニア級.mp3",
  "スターの走り.mp3",
];
const MUSIC_PANEL_ART_SRC = "/music/uma_music.webp";

function stageName(stage) {
  return stage?.name || stage?.id || "Debut";
}

function roomRaceImageSource(race) {
  return {
    id: race?.stage_key || race?.race_id || race?.id,
    name: race?.race_name || race?.name,
  };
}

function hasHumanPlayers(roomData) {
  return (roomData?.players || []).some((player) => !player.is_mob);
}

function hasOnlyBotsAfterLeave(roomData, userId) {
  const remainingPlayers = (roomData?.players || []).filter(
    (player) => String(player.id) !== String(userId)
  );

  return remainingPlayers.length > 0 && remainingPlayers.every((player) => player.is_mob);
}

function isUserInRoom(roomData, userId) {
  return (roomData?.players || []).some((player) => String(player.id) === String(userId));
}

function mergeRoomSummary(item, detail, userId) {
  return {
    ...item,
    phase: detail?.phase || item.phase,
    turn: detail?.turn ?? item.turn,
    player_count: detail?.players?.length ?? item.player_count,
    is_joined: isUserInRoom(detail, userId),
  };
}

function getAptitudeRows(roomData, player) {
  const distance = roomData?.distance || "Distance";
  const track = roomData?.track || "Track";
  const style = player?.style || "Style";

  return [
    { icon: speedIcon, label: "Speed", source: distance },
    { icon: powerIcon, label: "Power", source: track },
    { icon: witIcon, label: "Wit", source: style },
  ];
}

function getRaceDicePresetRows(roomData, color) {
  const table = getRaceDicePresetTable(roomData);
  const colorTable = table?.[color] || table?.[color?.toUpperCase?.()] || table?.[capitalize(color)] || null;
  const styleFirstTable = table && typeof table === "object" && !colorTable;
  if ((!colorTable || typeof colorTable !== "object") && !styleFirstTable) return [];

  return STYLE_OPTIONS.map((style) => ({
    style,
    values: normalizeDicePresetValues(
      styleFirstTable
        ? getDicePresetStyleColorValues(table, style, color)
        : colorTable[style] ||
            colorTable[style.toLowerCase()] ||
            colorTable[style.toUpperCase()] ||
            colorTable[snakeCase(style)]
    ),
  })).filter((row) => row.values.some(Boolean));
}

function getDicePresetStyleColorValues(table, style, color) {
  const styleTable =
    table?.[style] ||
    table?.[style.toLowerCase()] ||
    table?.[style.toUpperCase()] ||
    table?.[snakeCase(style)];
  if (!styleTable || typeof styleTable !== "object") return null;
  return styleTable[color] || styleTable[color?.toUpperCase?.()] || styleTable[capitalize(color)];
}

function getRaceDicePresetTable(roomData) {
  return (
    roomData?.dice_presets ||
    roomData?.dicePresets ||
    roomData?.dice_table ||
    roomData?.diceTable ||
    roomData?.dice_preset ||
    roomData?.dicePreset ||
    null
  );
}

function normalizeDicePresetValues(value) {
  if (Array.isArray(value)) return value.slice(0, 4).map(formatDicePresetValue);
  if (!value || typeof value !== "object") return [];

  return [1, 2, 3, 4].map((phase) => (
    formatDicePresetValue(
      value[phase] ||
      value[`phase_${phase}`] ||
      value[`phase${phase}`] ||
      value[`p${phase}`] ||
      value[`P${phase}`]
    )
  ));
}

function formatDicePresetValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value !== "object") return String(value);

  const dice = firstText(value.formula, value.dice, value.roll, value.expression);
  if (dice) return dice;

  const d = firstFiniteNumber(value.d, value.dice_count, value.diceCount, value.add_d);
  const cap = firstFiniteNumber(value.cap, value.sides, value.max, value.dice_cap);
  const kh = firstFiniteNumber(value.kh, value.keep_highest, value.keepHighest, value.selected);
  if (d && cap && kh) return `${d}d${cap}kh${kh}`;
  if (d && cap) return `${d}d${cap}`;
  if (d && kh) return `${d}dkh${kh}`;
  if (d) return `${d}d`;

  return "";
}

function getRaceStageBackground(roomData, fallback) {
  if (!roomData) return { key: "fallback", src: fallback };
  if (roomData.phase === "waiting") {
    return { key: "waiting-main", src: RACE_STAGE_BG_BY_PATH_TYPE.main };
  }

  const turn = roomData.race_mode === "web_timing"
    ? Number(roomData.leader_distance) || 0
    : Number(roomData.turn) || 0;
  const maxTurn = Number(roomData.max_turn) || 0;
  const isFinalTurn = roomData.race_mode !== "web_timing" && maxTurn > 0 && turn >= maxTurn;
  const pathType = Number(roomData.current_path?.type) || 1;
  const bgKey = roomData.phase === "ended" || isFinalTurn ? "end" : pathType;

  return {
    key: `${turn}-${bgKey}`,
    src: RACE_STAGE_BG_BY_PATH_TYPE[bgKey] || fallback,
  };
}

function getUpcomingRaceStageBackgrounds(roomData, fallback) {
  if (!roomData) return [fallback].filter(Boolean);
  const path = Array.isArray(roomData.path) ? roomData.path : [];
  const turn = Number(roomData.turn) || 0;
  const maxTurn = Number(roomData.max_turn) || 0;
  const upcomingKeys = new Set();

  for (let offset = 1; offset <= 2; offset += 1) {
    const nextTurn = turn + offset;
    if (maxTurn > 0 && nextTurn >= maxTurn) {
      upcomingKeys.add("end");
      continue;
    }

    const nextStep = path.find((step) => Number(step.turn) === nextTurn);
    upcomingKeys.add(Number(nextStep?.type) || 1);
  }

  return Array.from(upcomingKeys)
    .map((key) => RACE_STAGE_BG_BY_PATH_TYPE[key])
    .filter(Boolean);
}

function preloadImages(sources = []) {
  sources.filter(Boolean).forEach((source) => {
    const image = new Image();
    image.src = source;
  });
}

function getRaceRankImageSrc(rank, small = false) {
  const rankNumber = Number(rank);
  const imageIndex = Number.isFinite(rankNumber)
    ? Math.min(MAX_RACE_RANK_IMAGE_INDEX, Math.max(0, Math.floor(rankNumber) - 1))
    : 0;
  const prefix = small ? "utx_txt_order_s_" : "utx_txt_order_";
  return `/race_ranking/${prefix}${String(imageIndex).padStart(2, "0")}.webp`;
}

function getRandomItem(items = []) {
  return items[Math.floor(Math.random() * items.length)] || "";
}

function getMusicSrc(folder, fileName) {
  return encodeURI(`/music/${folder}/${fileName}`);
}

function getMusicTitle(fileName = "") {
  return String(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/_/g, " ");
}

function getRaceWinner(roomData) {
  const winner = (
    roomData?.result?.winner ||
    roomData?.result?.rankings?.[0] ||
    roomData?.scoreboard?.[0] ||
    null
  );
  if (!winner) return null;

  const winnerPlayer = (roomData?.players || []).find(
    (player) =>
      String(player.id) === String(winner.id) ||
      normalizeRaceName(player.name) === normalizeRaceName(winner.name)
  );

  return {
    ...winnerPlayer,
    ...winner,
    avatar: getRunnerAvatar(winnerPlayer || winner),
  };
}

function getFinalRaceScores(roomData) {
  const players = roomData?.players || [];
  const rankings = roomData?.scoreboard?.length
    ? roomData.scoreboard
    : roomData?.result?.rankings?.length
      ? roomData.result.rankings
      : players;
  const isWebTiming = roomData?.race_mode === "web_timing";

  return rankings
    .map((entry, index) => {
      const player = players.find(
        (item) =>
          String(item.id) === String(entry.id) ||
          normalizeRaceName(item.name) === normalizeRaceName(entry.name)
      );
      const racer = { ...player, ...entry };

      return {
        ...racer,
        rank: Number(entry.rank) || index + 1,
        finalScore: Number(
          isWebTiming
            ? racer.distance
            : racer.score ?? racer.total_score
        ) || 0,
      };
    })
    .sort((left, right) => left.rank - right.rank || right.finalScore - left.finalScore);
}

function isRaceEnded(roomData) {
  if (!roomData) return false;
  if (roomData.awaiting_turn_confirm) return false;

  return (
    roomData.phase === "ended" ||
    roomData.status === "ended" ||
    Boolean(roomData.winner_id) ||
    Boolean(roomData.result?.winner)
  );
}

export default function RaceGamePage({
  fullscreen = false,
  onBackToDashboard,
  username = "Unknown",
  userId = "",
  avatarUrl = "",
}) {
  const [rooms, setRooms] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState("Debut");
  const [gameplayMode, setGameplayMode] = useState("timing");
  const [style, setStyle] = useState(getSavedRaceStyle);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [showSkills, setShowSkills] = useState(false);
  const [skillPreview, setSkillPreview] = useState(null);
  const [skillLibrary, setSkillLibrary] = useState([]);
  const [diceTableColor, setDiceTableColor] = useState("white");
  const [hiddenRoomIds, setHiddenRoomIds] = useState(() => new Set());
  const [selectedBot, setSelectedBot] = useState("rookie_front");
  const [selectedBotLevel, setSelectedBotLevel] = useState(1);
  const [runDiceColorCache, setRunDiceColorCache] = useState({});
  const [musicNowPlaying, setMusicNowPlaying] = useState(null);
  const [musicVolume, setMusicVolume] = useState(getSavedRaceMusicVolume);
  const requestRef = useRef(false);
  const raceBgmRef = useRef(null);
  const zoneAudioRef = useRef(null);
  const raceBgmTrackRef = useRef(null);

  const playerPayload = useMemo(
    () => ({
      user_id: String(userId),
      username,
      avatar_url: avatarUrl || "",
      style,
    }),
    [avatarUrl, style, userId, username]
  );

  const handleStyleSelect = useCallback((nextStyle) => {
    const normalizedStyle = normalizeRaceStyle(nextStyle);
    setStyle(normalizedStyle);
    saveRaceStyleCookie(normalizedStyle);
  }, []);

  const handleRoomState = useCallback((nextRoom) => {
    setRoom((currentRoom) => {
      if (!currentRoom || currentRoom.room_id !== nextRoom.room_id) return nextRoom;
      if (currentRoom.phase === "ended" && nextRoom.phase !== "ended") return currentRoom;
      if (currentRoom.phase === "running" && nextRoom.phase === "waiting") return currentRoom;
      return nextRoom;
    });
  }, []);

  const { status: socketStatus } = useRaceSocket({
    roomId: room?.room_id,
    userId,
    onRoomState: handleRoomState,
  });

  const myPlayer = useMemo(
    () => room?.players?.find((player) => player.id === String(userId)),
    [room?.players, userId]
  );
  const isWebTiming = room?.race_mode === "web_timing";

  const canRun =
    room?.phase === "running" &&
    !room?.awaiting_turn_confirm &&
    myPlayer &&
    !myPlayer.is_mob &&
    myPlayer.last_roll_turn !== room.turn;
  const isConfirmingTurn =
    room?.phase === "running" &&
    Boolean(room?.awaiting_turn_confirm) &&
    myPlayer &&
    !myPlayer.is_mob &&
    myPlayer.last_roll_turn === room.turn;
  const hasConfirmedTurn = room?.turn_confirmations?.some(
    (confirmedId) => String(confirmedId) === String(userId)
  );

  const roomRaceImage = useMemo(
    () => getRaceImage(roomRaceImageSource(room)),
    [room]
  );
  const isRaceWaiting = room?.phase === "waiting";
  const raceStageBackground = useMemo(
    () => getRaceStageBackground(room, roomRaceImage),
    [room, roomRaceImage]
  );
  const nextRaceStageBackgrounds = useMemo(
    () => getUpcomingRaceStageBackgrounds(room, roomRaceImage),
    [room, roomRaceImage]
  );

  useEffect(() => {
    preloadImages([raceStageBackground.src, ...nextRaceStageBackgrounds]);
  }, [nextRaceStageBackgrounds, raceStageBackground.src]);

  useEffect(() => {
    if (raceBgmRef.current) raceBgmRef.current.volume = musicVolume;
    if (zoneAudioRef.current) zoneAudioRef.current.volume = musicVolume;
  }, [musicVolume]);

  const stopZoneMusic = useCallback(() => {
    const zoneAudio = zoneAudioRef.current;
    if (!zoneAudio) return;
    zoneAudio.onended = null;
    zoneAudio.pause();
    zoneAudio.currentTime = 0;
    zoneAudioRef.current = null;
  }, []);

  const stopRaceMusic = useCallback(() => {
    stopZoneMusic();
    const raceAudio = raceBgmRef.current;
    if (raceAudio) {
      raceAudio.pause();
      raceAudio.currentTime = 0;
    }
    raceBgmRef.current = null;
    raceBgmTrackRef.current = null;
    setMusicNowPlaying(null);
  }, [stopZoneMusic]);

  const playRaceMusic = useCallback(() => {
    if (typeof Audio === "undefined") return;

    const track = raceBgmTrackRef.current || getRandomItem(RACE_BGM_TRACKS);
    if (!track) return;
    raceBgmTrackRef.current = track;

    let raceAudio = raceBgmRef.current;
    if (!raceAudio) {
      raceAudio = new Audio(getMusicSrc("race_bgm", track));
      raceAudio.loop = true;
      raceAudio.volume = musicVolume;
      raceBgmRef.current = raceAudio;
    }

    setMusicNowPlaying({ title: getMusicTitle(track), mode: "Race BGM" });
    raceAudio.play().catch(() => {});
  }, [musicVolume]);

  const playZoneMusic = useCallback(() => {
    if (typeof Audio === "undefined") return;
    const track = getRandomItem(ZONE_TRACKS);
    if (!track) return;

    stopZoneMusic();
    const raceAudio = raceBgmRef.current;
    if (raceAudio) raceAudio.pause();

    const zoneAudio = new Audio(getMusicSrc("zone", track));
    zoneAudio.loop = false;
    zoneAudio.volume = musicVolume;
    zoneAudio.onended = () => {
      zoneAudioRef.current = null;
      if (room?.phase === "running" && !isRaceEnded(room)) {
        playRaceMusic();
      }
    };
    zoneAudioRef.current = zoneAudio;
    setMusicNowPlaying({ title: getMusicTitle(track), mode: "Zone" });
    zoneAudio.play().catch(() => {
      zoneAudioRef.current = null;
      playRaceMusic();
    });
  }, [musicVolume, playRaceMusic, room, stopZoneMusic]);

  useEffect(() => {
    if (room?.phase === "running" && !isRaceEnded(room)) {
      if (!zoneAudioRef.current) playRaceMusic();
      return undefined;
    }

    stopRaceMusic();
    return undefined;
  }, [playRaceMusic, room, stopRaceMusic]);

  useEffect(() => stopRaceMusic, [stopRaceMusic]);

  const leaderScore = isWebTiming
    ? Number(room?.leader_distance) || 0
    : Math.max(1, ...(room?.scoreboard || []).map((player) => Number(player.score) || 0));
  const turnProgress = room
    ? isWebTiming
      ? Math.min(100, Math.max(0, (Number(room.leader_distance) || 0) / Math.max(1, Number(room.finish_distance) || 1) * 100))
      : Math.min(100, Math.max(0, ((Number(room.turn) || 0) / Math.max(1, Number(room.max_turn) || 1)) * 100))
    : 0;
  const aptitudeRows = useMemo(
    () => getAptitudeRows(room, myPlayer),
    [myPlayer, room]
  );
  const latestRollByName = useMemo(
    () => getLatestRollByName(room?.action_logs || []),
    [room?.action_logs]
  );
  const myLatestRoll = useMemo(
    () => latestRollByName.get(normalizeRaceName(myPlayer?.name)),
    [latestRollByName, myPlayer?.name]
  );
  const myConfirmTurnScore = getRunnerTurnScore(myPlayer, room, myLatestRoll);
  const myRunDiceColorKey = getRunDiceColorKey(room, myPlayer, room?.turn);
  const myRunDiceColor = useMemo(
    () => runDiceColorCache[myRunDiceColorKey] || getRunnerCurrentDiceColor(myPlayer, room, myLatestRoll),
    [myLatestRoll, myPlayer, myRunDiceColorKey, room, runDiceColorCache]
  );
  const raceRunners = useMemo(
    () => getRaceRunnersByCurrentSpeed(room?.players || [], latestRollByName),
    [latestRollByName, room?.players]
  );
  const skillDetailsById = useMemo(() => {
    const entries = new Map();
    skillLibrary.forEach((skill) => {
      [skill.id, skill.skill_id, skill.name].filter(Boolean).forEach((key) => {
        entries.set(normalizeSkillKey(key), skill);
      });
    });
    return entries;
  }, [skillLibrary]);
  const scoreboardByName = useMemo(() => {
    const entries = new Map();
    (room?.scoreboard || []).forEach((player, index) => {
      const key = normalizeRaceName(player.name);
      if (key) entries.set(key, { ...player, rank: player.rank || index + 1 });
    });
    return entries;
  }, [room?.scoreboard]);
  const raceScorePlayers = useMemo(
    () => [...(room?.players || [])].sort((left, right) => {
      const leftScore = Number(isWebTiming ? left.distance : scoreboardByName.get(normalizeRaceName(left.name))?.score ?? left.score) || 0;
      const rightScore = Number(isWebTiming ? right.distance : scoreboardByName.get(normalizeRaceName(right.name))?.score ?? right.score) || 0;
      if (rightScore !== leftScore) return rightScore - leftScore;

      const leftRoll = latestRollByName.get(normalizeRaceName(left.name));
      const rightRoll = latestRollByName.get(normalizeRaceName(right.name));
      const leftSpeed = getRunnerMaxSpeedValue(left, leftRoll) ?? -Infinity;
      const rightSpeed = getRunnerMaxSpeedValue(right, rightRoll) ?? -Infinity;
      return rightSpeed - leftSpeed;
    }),
    [isWebTiming, latestRollByName, room?.players, scoreboardByName]
  );
  const myRaceRank = useMemo(() => {
    const scoreEntry = scoreboardByName.get(normalizeRaceName(myPlayer?.name));
    if (scoreEntry?.rank) return scoreEntry.rank;

    const playerIndex = raceScorePlayers.findIndex((player) => String(player.id) === String(userId));
    return playerIndex >= 0 ? playerIndex + 1 : null;
  }, [myPlayer?.name, raceScorePlayers, scoreboardByName, userId]);
  const raceScoreCards = raceScorePlayers.map((player, index) => {
    const latestRoll = latestRollByName.get(normalizeRaceName(player.name));
    const maxSpeed = getRunnerMaxSpeed(player, room, latestRoll);
    const state = getRunnerState(player, room);
    const avatar = getRunnerAvatar(player);
    const scoreEntry = scoreboardByName.get(normalizeRaceName(player.name)) || {};
    const score = Number(isWebTiming ? player.distance : scoreEntry.score ?? player.score) || 0;
    const diff = score - leaderScore;
    const rank = scoreEntry.rank || index + 1;

    return (
      <motion.article
        layout
        className="race-score-runner-card"
        key={player.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <span className="race-score-rank">
          <img src={getRaceRankImageSrc(rank, true)} alt={`Rank ${rank}`} />
        </span>
        <div className="race-player-avatar">
          {avatar ? <img src={avatar} alt="" /> : <Bot size={22} />}
        </div>
        <div className="race-runner-info">
          <div className="race-runner-title-row">
            <h3>{player.name}</h3>
            <em>{scoreEntry.style || player.style}</em>
          </div>
          <div className="race-player-meta">
            {isWebTiming ? (
              <>
                <span>{player.distance_left}m left</span>
                <span>{player.progress_percent}%</span>
                <span className="race-score-speed">P{player.phase} {player.tempo_level}</span>
                <span>{player.current_speed} SPD</span>
                {player.zone_active ? <span>Zone {player.zone_remaining_seconds}s</span> : null}
              </>
            ) : (
              <>
                <span><img src={staminaIcon} alt="Stamina" />{player.stamina_left}</span>
                <span><img src={witIcon} alt="Wit" />{player.wit_mana}</span>
                <span className="race-score-speed">{maxSpeed}</span>
              </>
            )}
            <span className={`race-score-diff ${diff === 0 ? "lead" : ""}`}>
              {diff === 0 ? <ChevronUp size={14} /> : diff}
            </span>
            <span className={`race-runner-state ${state.className}`}>
              {state.label}
            </span>
          </div>
        </div>
        <div className="race-score-card-total">
          <strong>{score}{isWebTiming ? "m" : ""}</strong>
          {isWebTiming && player.latest_timing_result ? (
            <small>{player.latest_timing_result.tier} +{player.latest_timing_result.distance_gain}m</small>
          ) : null}
        </div>
      </motion.article>
    );
  });
  const raceLiveScoreCards = raceScorePlayers.map((player, index) => {
    const avatar = getRunnerAvatar(player);
    const scoreEntry = scoreboardByName.get(normalizeRaceName(player.name)) || {};
    const score = Number(isWebTiming ? player.distance : scoreEntry.score ?? player.score) || 0;
    const rank = scoreEntry.rank || index + 1;

    return (
      <motion.article
        layout
        className={`race-live-score-card ${String(player.id) === String(userId) ? "is-player" : ""}`}
        key={player.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="race-live-score-avatar">
          {avatar ? <img src={avatar} alt="" /> : <Bot size={24} />}
          <span className="race-live-score-rank">
            <img src={getRaceRankImageSrc(rank, true)} alt={`Rank ${rank}`} />
          </span>
        </div>
        <strong>{score}m</strong>
        <small>{player.name}</small>
      </motion.article>
    );
  });
  const dicePresetRows = useMemo(
    () => getRaceDicePresetRows(room, diceTableColor),
    [diceTableColor, room]
  );
  const raceWinner = useMemo(() => getRaceWinner(room), [room]);

  useEffect(() => {
    if (!showSkills) setSkillPreview(null);
  }, [showSkills]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${RACE_API_BASE}/skills?tag=all`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setSkillLibrary(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSkillLibrary([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isConfirmingTurn || !myPlayer || !room?.room_id) return;

    const nextTurnKey = getRunDiceColorKey(room, myPlayer, Number(room.turn) + 1);
    if (!nextTurnKey) return;

    const nextTurnColor = getRunnerPreRollDiceColor(myPlayer, room);
    setRunDiceColorCache((current) => (
      current[nextTurnKey] === nextTurnColor
        ? current
        : { ...current, [nextTurnKey]: nextTurnColor }
    ));
  }, [isConfirmingTurn, myPlayer, room]);

  const refreshRooms = useCallback(async (extraHiddenRoomIds = []) => {
    try {
      setLoading(true);
      setError("");
      const data = await listRaceRooms();
      const extraHiddenIds = Array.isArray(extraHiddenRoomIds) ? extraHiddenRoomIds : [];
      const hiddenIds = new Set([...hiddenRoomIds, ...extraHiddenIds]);
      const nextRooms = (data.rooms || []).filter((item) => !hiddenIds.has(item.room_id));
      const visibleRooms = await Promise.all(
        nextRooms.map(async (item) => {
          try {
            const detail = await getRaceRoom(item.room_id, userId);
            return hasHumanPlayers(detail) ? mergeRoomSummary(item, detail, userId) : null;
          } catch {
            return item;
          }
        })
      );
      setRooms(visibleRooms.filter(Boolean));
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }, [hiddenRoomIds, userId]);

  useEffect(() => {
    let mounted = true;
    Promise.all([listRaceStages(), listRaceRooms()])
      .then(async ([raceData, roomData]) => {
        if (!mounted) return;
        const nextStages = raceData || [];
        setStages(nextStages);
        if (nextStages.some((stage) => stage.id === "Debut")) {
          setSelectedStage("Debut");
        } else if (nextStages[0]?.id) {
          setSelectedStage(nextStages[0].id);
        }
        const visibleRooms = await Promise.all(
          (roomData.rooms || [])
            .filter((item) => !hiddenRoomIds.has(item.room_id))
            .map(async (item) => {
            try {
              const detail = await getRaceRoom(item.room_id, userId);
              return hasHumanPlayers(detail) ? mergeRoomSummary(item, detail, userId) : null;
            } catch {
              return item;
            }
          })
        );
        if (mounted) setRooms(visibleRooms.filter(Boolean));
      })
      .catch((err) => setError(String(err.message || err)));
    return () => {
      mounted = false;
    };
  }, [hiddenRoomIds, userId]);

  useEffect(() => {
    if (!room?.room_id || !userId || socketStatus === "open") return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        setRoom(await getRaceRoom(room.room_id, userId));
      } catch (err) {
        setError(String(err.message || err));
      }
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, [room?.room_id, socketStatus, userId]);

  const runAction = async (label, action) => {
    if (requestRef.current) return;
    try {
      requestRef.current = true;
      setActionBusy(label);
      setError("");
      const shouldCloseAfterLeave = label === "leave" && hasOnlyBotsAfterLeave(room, userId);
      const nextRoom = await action();
      if (label === "leave") {
        if (shouldCloseAfterLeave && room?.room_id) {
          setHiddenRoomIds((current) => new Set(current).add(room.room_id));
        }
        setRoom(null);
        await refreshRooms(shouldCloseAfterLeave && room?.room_id ? [room.room_id] : []);
      } else if (nextRoom?.phase === "closed" || shouldCloseAfterLeave) {
        if (shouldCloseAfterLeave && room?.room_id) {
          setHiddenRoomIds((current) => new Set(current).add(room.room_id));
        }
        setRoom(null);
        await refreshRooms(shouldCloseAfterLeave && room?.room_id ? [room.room_id] : []);
      } else {
        setRoom(nextRoom);
      }
      return nextRoom;
    } catch (err) {
      setError(String(err.message || err));
      return null;
    } finally {
      requestRef.current = false;
      setActionBusy("");
    }
  };

  const handleRaceButtonSound = useCallback((event) => {
    const button = event.target.closest?.("button");
    if (!button || event.currentTarget.contains(button) === false || button.disabled) return;
    const isCloseAction =
      button.classList.contains("race-leave-btn") ||
      button.classList.contains("race-ghost-btn") ||
      (button.classList.contains("race-skill-toggle") && showSkills);
    playSound(isCloseAction ? "close" : "click");
  }, [showSkills]);

  const handleMusicVolumeChange = useCallback((event) => {
    const nextVolume = normalizeMusicVolume(Number(event.target.value) / 100);
    setMusicVolume(nextVolume);
    saveRaceMusicVolumeCookie(nextVolume);
  }, []);

  const handleCreate = () => {
    saveRaceStyleCookie(style);
    return runAction("create", () =>
      createRaceRoom({ ...playerPayload, gameplay_mode: gameplayMode }, selectedStage)
    );
  };

  const handleJoin = (roomItem) => {
    saveRaceStyleCookie(style);
    return runAction("join", () =>
      roomItem?.is_joined
        ? getRaceRoom(roomItem.room_id, userId)
        : joinRaceRoom(roomItem.room_id, playerPayload)
    );
  };

  const handleLeave = () =>
    runAction("leave", () => leaveRaceRoom(room.room_id, playerPayload));

  const handleAddBot = () =>
    runAction("bot", () => addRaceBot(room.room_id, playerPayload, selectedBot, selectedBotLevel));

  const handleAddRookies = () =>
    runAction("rookies", async () => {
      let nextRoom = room;
      for (const preset of ROOKIE_BOT_IDS) {
        nextRoom = await addRaceBot(room.room_id, playerPayload, preset, selectedBotLevel);
      }
      return nextRoom;
    });

  const handleStart = () =>
    runAction("start", () => startRaceRoom(room.room_id, playerPayload));

  const handleRun = () =>
    runAction("run", () => runRaceTurn(room.room_id, playerPayload));

  const timingRoomId = room?.room_id;
  const handleTiming = useCallback(
    async (timing) => {
      try {
        setError("");
        const nextRoom = await submitRaceTiming(timingRoomId, {
          ...timing,
          user_id: String(userId),
        });
        setRoom(nextRoom);
        return nextRoom;
      } catch (err) {
        setError(String(err.message || err));
        throw err;
      }
    },
    [timingRoomId, userId]
  );

  const handleConfirmTurn = () => {
    const nextTurnKey = getRunDiceColorKey(room, myPlayer, Number(room?.turn) + 1);
    if (nextTurnKey) {
      setRunDiceColorCache((current) => ({
        ...current,
        [nextTurnKey]: getRunnerPreRollDiceColor(myPlayer, room),
      }));
    }

    return runAction("confirm", () => confirmRaceTurn(room.room_id, playerPayload));
  };

  const handleReroll = () =>
    runAction("reroll", () => rerollRaceTurn(room.room_id, playerPayload));

  const handleWitReroll = () =>
    runAction("wit-reroll", () => witRerollRaceTurn(room.room_id, playerPayload));

  const handleSkill = (skill) =>
    runAction("skill", () =>
      useRaceSkill(room.room_id, userId, skill.slot, skill.id)
    );

  const handleZone = async () => {
    const nextRoom = await runAction("zone", () => useRaceZone(room.room_id, playerPayload));
    if (nextRoom) playZoneMusic();
  };

  const handleBlock = () =>
    runAction("block", () => useRaceBlock(room.room_id, playerPayload));

  const handleRush = () =>
    runAction("rush", () => useRaceRush(room.room_id, playerPayload));

  if (!room) {
    return (
    <section className={`race-page ${fullscreen ? "race-fullscreen-page" : ""}`} onClickCapture={handleRaceButtonSound}>
        <header className="race-hero">
          <div>
            <span className="race-kicker">Online Race</span>
            <h2>Race Lobby</h2>
          </div>
          <div className="race-toolbar">
            <button type="button" className="race-menu-home-btn" onClick={onBackToDashboard}>
              Main Site
            </button>
            <button type="button" onClick={() => refreshRooms()} disabled={loading}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {error && <div className="race-error">{error}</div>}

        <div className="race-create-panel">
          <label>
            Track
            <select
              value={selectedStage}
              onChange={(event) => setSelectedStage(event.target.value)}
            >
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stageName(stage)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gameplay
            <select value={gameplayMode} onChange={(event) => setGameplayMode(event.target.value)}>
              <option value="manual">Dice Gameplay</option>
              <option value="timing">Timing Gauge</option>
            </select>
          </label>
          <div className="race-style-tabs">
            {STYLE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={style === item ? "active" : ""}
                onClick={() => handleStyleSelect(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="race-primary-btn"
            onClick={handleCreate}
            disabled={Boolean(actionBusy)}
          >
            <Plus size={17} />
            {actionBusy === "create" ? "Creating..." : "Create Room"}
          </button>
        </div>

        <div className="race-room-grid">
          {rooms.length === 0 ? (
            <div className="race-empty">No web race rooms yet.</div>
          ) : (
            rooms.map((item) => {
              const raceImage = getRaceImage(roomRaceImageSource(item));
              const canJoinRoom = item.phase === "waiting" || item.is_joined;

              return (
                <article className="race-room-card" key={item.room_id}>
                  <img src={raceImage} alt="" />
                  <div>
                    <span className={`race-status-chip ${item.phase}`}>
                      {item.phase}
                    </span>
                    <h3>{item.race_name}</h3>
                    <p>
                      {item.race_mode === "web_timing"
                        ? `${item.finish_distance || "Standard"}m finish`
                        : `Turn ${item.max_turn}`} | {item.player_count} racers
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleJoin(item)}
                      disabled={Boolean(actionBusy) || !canJoinRoom}
                    >
                      {item.is_joined ? "Rejoin" : "Join"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    );
  }

  if (isRaceEnded(room)) {
    return (
      <section className={`race-page race-winner-page ${fullscreen ? "race-fullscreen-page" : ""}`} onClickCapture={handleRaceButtonSound}>
        <RaceWinnerModal winner={raceWinner} room={room} onLeave={handleLeave} />
      </section>
    );
  }

  return (
    <section className={`race-page race-hud-page ${isWebTiming ? "race-timing-page" : ""} ${fullscreen ? "race-fullscreen-page" : ""}`} onClickCapture={handleRaceButtonSound}>
      <header className="race-hero room race-hud-topbar">
        <div className="race-live-brand">
          <Trophy size={32} />
          {/* <div>
            <span className="race-kicker">Race Live</span>
            <h2>{room.race_name}</h2>
          </div> */}
        </div>

        <div className="race-hud-stat">
          <span>Race Live</span>
          <strong>{room.race_name}</strong>
        </div>

        <div className="race-hud-stat">
          <span>Track</span>
          <strong>{room.track}</strong>
        </div>

        <div className="race-hud-stat">
          <span>Distance</span>
          <strong>{isWebTiming ? `${room.finish_distance}m` : room.distance}</strong>
        </div>

        <div className="race-hud-stat race-hud-turn">
          <span>{isWebTiming ? "Leader" : "Turn"}</span>
          <strong>
            {isWebTiming ? `${room.leader_distance || 0}m` : room.turn}
            <small>/{isWebTiming ? `${room.finish_distance}m` : room.max_turn}</small>
          </strong>
          <div><span style={{ width: `${turnProgress}%` }} /></div>
        </div>

        <div className="race-hud-stat">
          <span>Phase</span>
          <strong>{isWebTiming ? room.leader_phase : room.race_phase || room.phase}</strong>
        </div>

        <div className="race-top-actions">
          {fullscreen && (
            <button type="button" className="race-ghost-btn" onClick={onBackToDashboard}>
              Dashboard
            </button>
          )}
          <button type="button" className="race-ghost-btn race-leave-btn" onClick={handleLeave}>
            <DoorOpen size={16} />
            Leave Room
          </button>
        </div>
      </header>

      {error && <div className="race-error">{error}</div>}

      <div className="race-hud-grid">
        <aside className="race-track-panel race-hud-panel race-track-hud">
          <PanelTitle icon={<MapIcon size={16} />} title="Track HUD" />
          <div className="race-track-map">
            <img className="race-track-image" src={roomRaceImage} alt="" />
            <div className="race-map-overlay">
              <span>{room.current_path?.label || "Start"}</span>
              <b>{Math.round(turnProgress)}%</b>
            </div>
          </div>
          
          <div className="race-info-tile-grid">
            {/* <div><Flag size={15} /><span>{room.current_path?.label || "-"}</span></div>
            <div><Gauge size={15} /><span>{room.distance}</span></div>
            <div><Target size={15} /><span>{room.track}</span></div> */}
            <div><Users size={15} /><span>{room.players?.length || 0} racers</span></div>
          </div>
          <div className="race-aptitude-panel">
            <span>Aptitude Bonus</span>
            <div>
              {aptitudeRows.map((item) => (
                <em key={`${item.label}-${item.source}`}>
                  <img src={item.icon} alt="" />
                  <strong>{item.source}</strong>
                </em>
              ))}
            </div>
          </div>
          <div className="race-dice-preset-panel">
            {isWebTiming ? (
              <div className="race-distance-summary">
                <span>Distance Race</span>
                <strong>{myPlayer?.distance || 0} / {room.finish_distance}m</strong>
                <em>{myPlayer?.distance_left ?? room.finish_distance}m left | {myPlayer?.phase || "Start"}</em>
              </div>
            ) : (
              <>
                <div className="race-dice-preset-head">
                  <span>Dice</span>
                  <div className="race-dice-color-toggle" aria-label="Dice preset color">
                    {DICE_COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={diceTableColor === color ? "active" : ""}
                        onClick={() => setDiceTableColor(color)}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
                {dicePresetRows.length > 0 ? (
                  <div className="race-dice-preset-table">
                    <div className="race-dice-preset-row is-head">
                      <span>Style</span>
                      {[1, 2, 3, 4].map((phase) => (
                        <span key={phase} className={Number(room.race_phase) === phase ? "active" : ""}>
                          P{phase}
                        </span>
                      ))}
                    </div>
                    {dicePresetRows.map((row) => (
                      <div className="race-dice-preset-row" key={row.style}>
                        <strong>{row.style}</strong>
                        {row.values.map((value, index) => (
                          <span key={`${row.style}-${index}`} className={Number(room.race_phase) === index + 1 ? "active" : ""}>
                            {value || "-"}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="race-dice-preset-empty">No preset data from backend.</p>
                )}
              </>
            )}
            <div className={`race-now-playing ${musicNowPlaying ? "is-playing" : ""}`}>
              <img
                className="race-now-playing-art"
                src={MUSIC_PANEL_ART_SRC}
                alt=""
              />
              <div>
                <div className="race-now-playing-title">
                  <Music2 size={16} />
                  <span>{musicNowPlaying?.mode || "Race Audio"}</span>
                </div>
                <strong>{musicNowPlaying?.title || "Waiting for start"}</strong>
                <label className="race-volume-control">
                  <span>{Math.round(musicVolume * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(musicVolume * 100)}
                    onChange={handleMusicVolumeChange}
                    aria-label="Race music volume"
                  />
                </label>
              </div>
            </div>
          </div>
        </aside>

        <main className="race-hud-panel race-live-panel">
          <div className="race-live-stage">
            <AnimatePresence mode="wait">
              <motion.div
                key={raceStageBackground.key}
                className={`race-live-bg ${isRaceWaiting ? "is-static" : ""}`}
                style={{ backgroundImage: `url(${raceStageBackground.src})` }}
                initial={isRaceWaiting ? false : { opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={isRaceWaiting ? undefined : { opacity: 0, scale: 1.18 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </AnimatePresence>
            {!isRaceWaiting && (
              <div className="race-speed-burst" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => (
                  <span
                    key={index}
                    style={{
                      "--i": index,
                      "--angle": `${(index * 137.5) % 360}deg`,
                      "--delay": `${-((index * 0.073) % 1.35)}s`,
                      "--duration": `${0.58 + (index % 7) * 0.055}s`,
                      "--length": `${150 + (index % 6) * 38}px`,
                      "--thickness": `${2 + (index % 4)}px`,
                      "--start": `${34 + (index % 5) * 16}px`,
                      "--end": `${330 + (index % 8) * 56}px`,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="race-live-stage-overlay" />
            <div className="race-path-strip uma-scroll" aria-label="Track path">
              {room.path?.map((step) => (
                <span
                  key={step.turn}
                  className={step.active ? "active" : ""}
                  title={`${step.turn}: ${step.label}`}
                >
                  {step.icon}
                </span>
              ))}
            </div>
            <div className="race-phase-banner">
              <Zap size={18} />
              {isWebTiming ? `Leader: ${room.leader_phase}` : room.race_phase ? `Phase ${room.race_phase}` : "Race"}
            </div>
            {myRaceRank ? (
              <div className="race-my-rank-badge" aria-label={`Your rank ${myRaceRank}`}>
                <img src={getRaceRankImageSrc(myRaceRank)} alt={`Your rank ${myRaceRank}`} />
              </div>
            ) : null}
            {isWebTiming ? (
              <div className="race-live-scoreboard uma-scroll" aria-label="Live race scoreboard">
                {raceLiveScoreCards}
              </div>
            ) : null}
            <AnimatePresence>
              {skillPreview && (
                <RaceSkillPreview preview={skillPreview} />
              )}
            </AnimatePresence>
          </div>
        </main>

        {isWebTiming && (
          <section className="race-timing-control-panel">
            <TimingRaceGauge
              active={room.phase === "running" && room.gameplay_mode === "timing"}
              gauge={room.timing_gauges?.[String(userId)] || room.timing_gauge}
              timingConfig={room.timing_config}
              runningStyle={myPlayer?.style || style}
              onSubmit={handleTiming}
            />
          </section>
        )}

        <aside className="race-score-panel race-hud-panel">
          <PanelTitle icon={<Trophy size={16} />} title="Scoreboard" />
          <div className="race-score-list uma-scroll">
            {raceScoreCards}
          </div>
          <div className="race-status-panel">
            <div><Activity size={16} /><span>{room.phase}</span></div>
            <div><Radio size={16} /><span>{socketStatus}</span></div>
          </div>
        </aside>

        <section className="race-log-panel race-hud-panel">
          <PanelTitle icon={<Radio size={16} />} title="Race Commentary" />
          <div className="race-log-list uma-scroll">
            {(room.action_logs || []).slice().reverse().map((log) => (
              <RaceLogItem key={log.id} log={log} />
            ))}
          </div>
        </section>

        <aside className={`race-command-panel race-hud-panel uma-scroll ${room.phase === "running" ? "is-running" : ""} ${room.phase === "running" && room.gameplay_mode === "timing" ? "is-timing" : ""}`}>
          {room.phase === "waiting" ? (
            <>
              <div className="race-bot-picker">
                <label>
                  Bot
                  <select
                    value={selectedBot}
                    onChange={(event) => setSelectedBot(event.target.value)}
                    disabled={Boolean(actionBusy)}
                  >
                    {BOT_OPTIONS.map((bot) => (
                      <option key={bot.id} value={bot.id}>
                        {bot.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Lv
                  <select
                    value={selectedBotLevel}
                    onChange={(event) => setSelectedBotLevel(Number(event.target.value))}
                    disabled={Boolean(actionBusy)}
                  >
                    {Array.from({ length: 8 }, (_, index) => index + 1).map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="race-bot-row">
                <button type="button" onClick={handleAddBot} disabled={Boolean(actionBusy)}>
                  <Bot size={15} />
                  Add Bot
                </button>
                <button type="button" onClick={handleAddRookies} disabled={Boolean(actionBusy)}>
                  <Users size={15} />
                  Add Rookies
                </button>
              </div>
              <button
                type="button"
                className="race-primary-btn race-run-btn"
                onClick={handleStart}
                disabled={String(room.owner_id) !== String(userId) || Boolean(actionBusy)}
              >
                <Play size={20} />
                Start Race
              </button>
            </>
          ) : isRaceEnded(room) ? (
            <button type="button" className="race-primary-btn race-run-btn" onClick={handleLeave}>
              <DoorOpen size={20} />
              Leave Room
            </button>
          ) : room.gameplay_mode === "timing" ? (
            <>
              <div className="race-auto-run-card">
                <Flag size={20} />
                <div>
                  <strong>Auto Running</strong>
                  <span>Hit the timing gauge once each cycle.</span>
                </div>
              </div>
              <button
                type="button"
                className="race-skill-toggle race-skill-btn"
                onClick={() => setShowSkills((value) => !value)}
              >
                <Sparkles size={22} />
                Skill
              </button>
              <RaceSkillMenu
                actionBusy={actionBusy}
                myPlayer={myPlayer}
                onSkill={handleSkill}
                onZone={handleZone}
                setSkillPreview={setSkillPreview}
                showSkills={showSkills}
                skillDetailsById={skillDetailsById}
              />
            </>
          ) : isConfirmingTurn ? (
            <>
              <button
                type="button"
                className="race-primary-btn race-confirm-btn"
                onClick={handleConfirmTurn}
                disabled={hasConfirmedTurn || Boolean(actionBusy)}
              >
                <Play size={20} />
                {actionBusy === "confirm" ? "Confirming..." : "Confirm Turn"}
              </button>
              
              <div className="race-confirm-card">
                <span>Turn {room.turn} Result</span>
                <strong>{myConfirmTurnScore}</strong>
                <p>{hasConfirmedTurn ? "Confirmed. Waiting for racers..." : "Review your score before next turn."}</p>
              </div>
              
              <div className="race-reroll-actions">
                <button
                  type="button"
                  onClick={handleReroll}
                  disabled={
                    hasConfirmedTurn ||
                    !myPlayer ||
                    myPlayer.no_reroll_this_turn ||
                    myPlayer.reroll_left <= 0 ||
                    Boolean(actionBusy)
                  }
                >
                  Reroll {myPlayer?.reroll_left ?? 0}
                </button>
                <button
                  type="button"
                  onClick={handleWitReroll}
                  disabled={
                    hasConfirmedTurn ||
                    !myPlayer ||
                    myPlayer.no_reroll_this_turn ||
                    myPlayer.wit_reroll_left <= 0 ||
                    Boolean(actionBusy)
                  }
                >
                  WIT Reroll {myPlayer?.wit_reroll_left ?? 0}
                </button>
              </div>
              <div className="race-reroll-actions">
                <button
                  type="button"
                  className="race-block-btn"
                  onClick={handleBlock}
                  disabled={hasConfirmedTurn || !myPlayer || myPlayer.used_block || Boolean(actionBusy)}
                >
                  Block
                </button>
                <button
                  type="button"
                  className="race-rush-btn"
                  onClick={handleRush}
                  disabled={hasConfirmedTurn || !myPlayer || myPlayer.used_rush || Boolean(actionBusy)}
                >
                  Rush
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="race-main-actions">
                <button
                  type="button"
                  className={`race-primary-btn race-run-btn ${myRunDiceColor === "gold" ? "is-gold" : "is-white"}`}
                  onClick={handleRun}
                  disabled={!canRun || Boolean(actionBusy)}
                >
                  <Flag size={22} />
                  {actionBusy === "run" ? "Running..." : "Run"}
                </button>
                <button
                  type="button"
                  className="race-skill-toggle race-skill-btn"
                  onClick={() => setShowSkills((value) => !value)}
                >
                  <Sparkles size={22} />
                  Skill
                </button>
              </div>

              <RaceSkillMenu
                actionBusy={actionBusy}
                myPlayer={myPlayer}
                onSkill={handleSkill}
                onZone={handleZone}
                setSkillPreview={setSkillPreview}
                showSkills={showSkills}
                skillDetailsById={skillDetailsById}
              />
            </>
          )}
        </aside>

      </div>
    </section>
  );
}

function PanelTitle({ icon, title }) {
  return (
    <h3 className="race-panel-title">
      {icon}
      {title}
    </h3>
  );
}

function RaceSkillMenu({
  actionBusy,
  myPlayer,
  onSkill,
  onZone,
  setSkillPreview,
  showSkills,
  skillDetailsById,
}) {
  return (
    <AnimatePresence>
      {showSkills && (
        <motion.div
          className="race-skill-list uma-scroll"
          onMouseLeave={() => setSkillPreview(null)}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div
            className="race-skill-action-wrap"
            onMouseEnter={() => setSkillPreview(getRaceActionPreview("zone", myPlayer?.zone, skillDetailsById))}
            onFocus={() => setSkillPreview(getRaceActionPreview("zone", myPlayer?.zone, skillDetailsById))}
          >
            <button
              type="button"
              className="race-zone-btn"
              onClick={onZone}
              disabled={!myPlayer || myPlayer.zone_left <= 0 || Boolean(actionBusy)}
            >
              <span>Zone</span>
              <strong>{myPlayer?.zone?.name || "Use Zone"}</strong>
              <em>{Math.max(0, Number(myPlayer?.zone_left) || 0)} left</em>
            </button>
          </div>
          {(myPlayer?.skills || []).map((skill) => (
            <div
              className="race-skill-action-wrap"
              key={skill.slot}
              onMouseEnter={() => setSkillPreview(getRaceActionPreview("skill", skill, skillDetailsById))}
              onFocus={() => setSkillPreview(getRaceActionPreview("skill", skill, skillDetailsById))}
            >
              <button
                type="button"
                disabled={!skill.id || skill.cooldown > 0 || Boolean(actionBusy)}
                onClick={() => onSkill(skill)}
              >
                <span>{skill.slot}</span>
                <strong>{skill.name || "Empty"}</strong>
                <em>{skill.cooldown > 0 ? `CD ${skill.cooldown}` : `${skill.cost || 0} WIT`}</em>
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RaceSkillPreview({ preview }) {
  const effects = preview.effects.length > 0 ? preview.effects : [{ label: "Effect", value: "No effect detail available." }];

  return (
    <motion.article
      className="race-skill-preview"
      initial={{ opacity: 0, x: -18, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -18, scale: 0.96 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="skill-top-row">
        <div className="skill-icon-box">
          {preview.kind === "zone" ? <Zap size={22} /> : getSkillIcon(preview.icon)}
        </div>
        <div>
          <div className="skill-id">{preview.id}</div>
          <h3>{preview.name}</h3>
        </div>
      </div>

      <div className="skill-main-row">
        <div className="skill-content">
          <div className="content-meta-row">
            <span>{preview.cooldown}</span>
            <span className="skill-cost">
              <img src={witIcon} alt="cost" />
              {preview.cost}
            </span>
            <span>{preview.target}</span>
          </div>

          <div className="skill-trigger">
            <strong>Condition:</strong> {preview.trigger}
          </div>

          <div className="skill-effects">
            <strong>{preview.kind === "zone" ? "Zone Effect" : "Skill Effect"}</strong>
            <ul>
              {effects.map((effect, index) => (
                <li key={`${effect.label}-${index}`}>
                  <b>{renderEffectLabel(effect.label)}:</b> {renderRaceTextWithIcons(effect.value)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function RaceWinnerModal({ winner, room, onLeave }) {
  const winnerName = winner?.name || winner?.username || "Winner";
  const winnerStyle = winner?.style || winner?.running_style || "-";
  const winnerScore = winner?.distance ?? winner?.score ?? winner?.total_score ?? 0;
  const winnerUnit = winner?.distance !== undefined ? "m" : " score";
  const winnerAvatar = winner?.avatar || getRunnerAvatar(winner);
  const isWebTiming = room?.race_mode === "web_timing";
  const finalScores = getFinalRaceScores(room);

  return (
    <div className="race-winner-overlay" role="dialog" aria-modal="true" aria-label="Race winner">
      <div className="race-confetti" aria-hidden="true">
        {Array.from({ length: 38 }, (_, index) => (
          <span
            key={index}
            style={{
              "--x": `${(index * 29) % 100}%`,
              "--drift": `${index % 2 === 0 ? "-" : ""}${24 + (index % 8) * 9}px`,
              "--delay": `${-((index * 0.19) % 3.2)}s`,
              "--duration": `${2.8 + (index % 6) * 0.24}s`,
              "--color": ["#76d681", "#f5d35f", "#6fd3ff", "#ffffff", "#d8a65a"][index % 5],
            }}
          />
        ))}
      </div>

      <motion.div
        className="race-winner-card"
        initial={{ opacity: 0, y: 18, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Trophy size={42} />
        <div className="race-winner-portrait">
          {winnerAvatar ? <img src={winnerAvatar} alt="" /> : <Bot size={48} />}
        </div>
        <span>Winner</span>
        <h2>{winnerName}</h2>
        <div className="race-winner-meta">
          <em>{winnerStyle}</em>
          <strong>{winnerScore}{winnerUnit}</strong>
        </div>
        <div className="race-final-scoreboard">
          <h3>Final Scores</h3>
          <div className="race-final-score-list uma-scroll">
            {finalScores.map((player) => {
              const avatar = getRunnerAvatar(player);
              return (
                <div className="race-final-score-row" key={player.id || player.name}>
                  <span className="race-final-score-rank">#{player.rank}</span>
                  <div className="race-final-score-avatar">
                    {avatar ? <img src={avatar} alt="" /> : <Bot size={18} />}
                  </div>
                  <strong>{player.name || player.username || "Racer"}</strong>
                  <b>{player.finalScore}{isWebTiming ? "m" : " pts"}</b>
                </div>
              );
            })}
          </div>
        </div>
        <button type="button" className="race-primary-btn race-run-btn" onClick={onLeave}>
          <DoorOpen size={20} />
          Leave Room
        </button>
      </motion.div>
    </div>
  );
}

function getLatestRollByName(logs) {
  const entries = new Map();

  [...logs].reverse().forEach((log) => {
    const summary = log.payload?.roll_summary;
    if (!summary) return;

    const name = normalizeRaceName(getLogPlayerName(log));
    if (!name || entries.has(name)) return;

    entries.set(name, {
      total: summary.total ?? getScoreFromLogMessage(log.message),
      turn: log.turn,
      current_max_speed: summary.current_max_speed,
      distance_color: summary.distance_color,
    });
  });

  return entries;
}

function normalizeRaceName(value = "") {
  return String(value).trim().toLowerCase();
}

function getRunnerTurnScore(player, room, latestRoll) {
  const currentTurn = Number(room?.turn);
  const rolledThisTurn = Number(player?.last_roll_turn) === currentTurn;
  const playerRollTotal = player?.last_roll?.total;

  if (rolledThisTurn && Number.isFinite(Number(playerRollTotal))) {
    return signed(playerRollTotal);
  }

  if (latestRoll?.turn === currentTurn && Number.isFinite(Number(latestRoll.total))) {
    return signed(latestRoll.total);
  }

  return "0";
}

function getRunnerMaxSpeed(player, room, latestRoll) {
  const speed = getRunnerMaxSpeedValue(player, latestRoll);

  if (speed === null) return "Max -";

  return `${Math.floor(formatCompactNumber(speed))} f/s`;
}

function getRunnerMaxSpeedValue(player, latestRoll) {
  return firstFiniteNumber(
    player?.current_max_speed,
    player?.currentMaxSpeed,
    player?.max_speed,
    player?.maxSpeed,
    player?.last_roll?.current_max_speed,
    latestRoll?.current_max_speed
  );
}

function getRaceRunnersByCurrentSpeed(players, latestRollByName) {
  return [...players].sort((left, right) => {
    const leftRoll = latestRollByName.get(normalizeRaceName(left.name));
    const rightRoll = latestRollByName.get(normalizeRaceName(right.name));
    const leftSpeed = getRunnerMaxSpeedValue(left, leftRoll) ?? -Infinity;
    const rightSpeed = getRunnerMaxSpeedValue(right, rightRoll) ?? -Infinity;

    if (rightSpeed !== leftSpeed) return rightSpeed - leftSpeed;

    const leftRank = Number(left.rank);
    const rightRank = Number(right.rank);
    if (Number.isFinite(leftRank) && Number.isFinite(rightRank) && leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return (Number(right.score) || 0) - (Number(left.score) || 0);
  });
}

function getRunnerCurrentDiceColor(player, room, latestRoll) {
  if (!player || room?.phase !== "running") return "white";

  const explicitColor = normalizeDiceColor(
    player.current_distance_color ||
      player.current_dice_color ||
      player.distance_color ||
      player.dice_color ||
      player.pending_distance_color ||
      player.next_distance_color
  );
  if (explicitColor) return explicitColor;

  if (Number(player.last_roll_turn) !== Number(room?.turn)) {
    return getRunnerPreRollDiceColor(player, room);
  }

  const rolledThisTurn = Number(player.last_roll_turn) === Number(room?.turn);
  const rollColor = normalizeDiceColor(player.last_roll?.distance_color);
  if (rolledThisTurn && rollColor) return rollColor;

  const latestRollColor = normalizeDiceColor(latestRoll?.distance_color);
  if (Number(latestRoll?.turn) === Number(room?.turn) && latestRollColor) {
    return latestRollColor;
  }

  return isRunnerInGoldRange(player, room) ? "gold" : "white";
}

function getRunnerPreRollDiceColor(player, room) {
  return isRunnerInGoldRange(player, room) ? "gold" : "white";
}

function getRunDiceColorKey(room, player, turn) {
  if (!room?.room_id || !player?.id || turn === undefined || turn === null) return "";
  return `${room.room_id}:${player.id}:${turn}`;
}

function normalizeDiceColor(value = "") {
  const color = String(value || "").trim().toLowerCase();
  if (color === "gold" || color === "golden") return "gold";
  if (color === "white") return "white";
  return "";
}

function isRunnerInGoldRange(player, room) {
  const playerScore = Number(player?.score);
  if (!Number.isFinite(playerScore)) return false;

  const goldRange = Math.max(0, 20 + getRunnerGoldRangeBonus(player));
  const competitors = (room?.players || []).filter((other) => String(other?.id) !== String(player?.id));

  return competitors.some((other) => {
    const otherScore = Number(other?.score);
    return Number.isFinite(otherScore) && Math.abs(otherScore - playerScore) <= goldRange;
  });
}

function getRunnerGoldRangeBonus(player) {
  return firstFiniteNumber(
    player?.pending_bonus?.gold_range,
    player?.buffs?.gold_range,
    player?.buffs?.pending_bonus?.gold_range,
    player?.last_roll?.pending_bonus?.gold_range
  ) ?? 0;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return null;
}

function formatCompactNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, "");
}

function getRunnerState(player, room) {
  if (player?.is_mob) return { label: "BOT", className: "is-bot" };
  if (Number(player?.last_roll_turn) === Number(room?.turn)) {
    return { label: "DONE", className: "is-done" };
  }
  return { label: "READY", className: "is-ready" };
}

function getRunnerAvatar(player) {
  if (!player) return "";
  const localMobAvatarById = getLocalMobAvatarById(player.mob_preset_key);
  if (localMobAvatarById) return localMobAvatarById;

  const localMobAvatar = getLocalMobAvatar(player.name || player.username);
  if (localMobAvatar) return localMobAvatar;

  const localPathAvatar = getLocalMobAvatarFromPath(player.thumbnail || player.avatar);
  if (localPathAvatar) return localPathAvatar;

  return player.is_mob
    ? firstUsableImage(player.thumbnail, player.avatar)
    : firstUsableImage(player.avatar, player.thumbnail);
}

function getLocalMobAvatarById(id = "") {
  return LOCAL_MOB_AVATAR_BY_ID[String(id || "").trim()] || "";
}

function getLocalMobAvatar(name = "") {
  const normalizedName = normalizeRaceName(name)
    .replace(/\s+lv\.\d+$/i, "")
    .replace(/\s+/g, " ");
  return LOCAL_MOB_AVATAR_BY_NAME[normalizedName] || "";
}

function getLocalMobAvatarFromPath(value = "") {
  const fileName = String(value || "").trim().split(/[\\/]/).pop();
  return LOCAL_MOB_AVATAR_FILES.has(fileName) ? `/mobs/${fileName}` : "";
}

function firstUsableImage(...values) {
  return values.find((value) => isUsableImageSrc(value)) || "";
}

function isUsableImageSrc(value) {
  const text = String(value || "").trim();
  return Boolean(text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/")));
}

function RaceLogItem({ log }) {
  const summary = log.payload?.roll_summary;
  const bonusRows = getRollBonusRows(summary);
  const actionEffectRows = summary ? [] : getActionEffectRows(log);
  const playerName = getLogPlayerName(log);
  const turnScore = summary?.total ?? getScoreFromLogMessage(log.message);

  return (
    <article className={`race-log-item ${summary ? "race-log-roll" : ""}`}>
      {summary ? (
        <div className="race-log-summary-grid">
          <div className="race-log-summary-player">
            <span>T{log.turn}</span>
            <strong>{playerName}</strong>
            <b>+{turnScore}</b>
          </div>
          <div className="race-log-summary-dice">
            {formatRollDice(summary.dice || summary.base_total || "-", summary.base_total)}
            {summary.distance_color ? <em>{summary.distance_color}</em> : null}
          </div>
          <div className="race-log-bonus-list">
            {bonusRows.length > 0
              ? bonusRows.map((item) => (
                  <em key={`${item.label}-${item.value}-${item.index}`}>
                    {item.icon && <img src={item.icon} alt={item.label} />}
                    {item.note && <span>{item.note}</span>}
                    <strong>{item.value}</strong>
                  </em>
                ))
              : <em>No bonus</em>}
          </div>
        </div>
      ) : (
        <>
          <p>
            <span>T{log.turn}</span>
            {log.message}
          </p>
          {actionEffectRows.length > 0 ? (
            <div className="race-log-action-effects">
              {actionEffectRows.map((item, index) => (
                <em key={`${item.label}-${item.value}-${index}`}>
                  <span>{renderEffectLabel(item.label)}</span>
                  <strong>{item.value}</strong>
                </em>
              ))}
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}

function getLogPlayerName(log) {
  const payloadName =
    log.payload?.player_name ||
    log.payload?.username ||
    log.payload?.player?.name;
  if (payloadName) return payloadName;

  return String(log.message || "")
    .replace(/\s+(?:(?:auto\s+)?ran|(?:wit\s+)?rerolled)\s+[+-]?\d+.*/i, "")
    .trim() || "Racer";
}

function getScoreFromLogMessage(message = "") {
  const match = String(message).match(/(?:ran|rerolled)\s+\+?(-?\d+)/i);
  return match ? Number(match[1]) : "-";
}

function getRollBonusRows(summary) {
  if (!summary) return [];

  return parseDiscordBonusDisplay(summary.bonus_display);
}

function getActionEffectRows(log) {
  const payload = log?.payload || {};
  const message = String(log?.message || "");
  const isSkillOrZone = /skill|zone/i.test(message) || payload.skill || payload.zone;
  if (!isSkillOrZone) return [];

  const rows = [];
  const sources = [
    payload.effect,
    payload.effects,
    payload.build,
    payload.changes,
    payload.applied,
    payload.pending_bonus,
    payload.skill?.effect,
    payload.skill?.effects,
    payload.skill?.build,
    payload.zone?.effect,
    payload.zone?.effects,
    payload.zone?.build,
    payload.zone?.pending_bonus,
    payload.result?.effect,
    payload.result?.effects,
    payload.result?.build,
    payload.result?.pending_bonus,
  ];

  sources.forEach((source) => collectEffectRows(source, rows));

  const text = firstText(
    payload.effect_text,
    payload.description,
    payload.skill?.effect_text,
    payload.skill?.description,
    payload.zone?.effect_text,
    payload.zone?.description,
    payload.result?.effect_text
  );
  if (text && rows.length === 0) {
    rows.push({ label: "Effect", value: text });
  }

  return rows.slice(0, 8);
}

function collectEffectRows(source, rows) {
  if (!source) return;
  if (Array.isArray(source)) {
    source.forEach((item) => collectEffectRows(item, rows));
    return;
  }
  if (typeof source === "string") {
    if (source.trim()) rows.push({ label: "Effect", value: source.trim() });
    return;
  }
  if (typeof source !== "object") return;

  Object.entries(source).forEach(([key, rawValue]) => {
    if (rawValue && typeof rawValue === "object") {
      collectEffectRows(rawValue, rows);
      return;
    }

    const row = formatEffectRow(key, rawValue);
    if (row) rows.push(row);
  });
}

function formatEffectRow(key, rawValue) {
  const number = Number(rawValue);
  const label = EFFECT_LABELS[key] || EFFECT_LABELS[snakeCase(key)] || prettifyEffectKey(key);

  if (Number.isFinite(number)) {
    if (number === 0) return null;
    return { label, value: signed(number) };
  }

  const text = String(rawValue || "").trim();
  if (!text || text === "-") return null;
  return { label, value: text };
}

function getRaceActionPreview(kind, item = {}, skillDetailsById = new Map()) {
  const action = item || {};
  const details = findSkillDetails(action, skillDetailsById);
  const merged = { ...details, ...action };
  const rows = [];
  [
    merged.effects,
    merged.effect,
    merged.effect_text,
    merged.description,
    merged.build,
    merged.pending_bonus,
    merged.changes,
  ].forEach((source) => collectEffectRows(source, rows));

  return {
    kind,
    id: firstText(merged.id, merged.skill_id, merged.key, kind === "zone" ? "Zone" : `Slot ${merged.slot || "-"}`),
    name: firstText(merged.name, merged.title, kind === "zone" ? "Use Zone" : "Empty"),
    icon: merged.icon || "Velocity",
    cooldown: kind === "zone" ? "Zone" : `CD ${Number(merged.cooldown) || 0}`,
    cost: kind === "zone" ? "-" : Number(merged.cost) || 0,
    target: firstText(merged.target, merged.scope, kind === "zone" ? "Self" : "Target"),
    trigger: firstText(merged.trigger, merged.condition, merged.timing, kind === "zone" ? "Available while Zone remains." : "Available when the skill is ready."),
    effects: rows.slice(0, 8),
  };
}

function findSkillDetails(action = {}, skillDetailsById = new Map()) {
  const keys = [action.id, action.skill_id, action.key, action.name].map(normalizeSkillKey);
  return keys.map((key) => skillDetailsById.get(key)).find(Boolean) || {};
}

function renderRaceTextWithIcons(value) {
  const text = String(value || "");
  if (!text) return null;

  const parts = text.split(/(<:[^:>]+:\d+>)/g);
  return parts.map((part, index) => {
    const match = part.match(/^<:([^:>]+):\d+>$/);
    if (!match) return part;

    const iconName = match[1];
    const icon = DISCORD_BONUS_ICON_MAP[iconName] || BONUS_ICONS[snakeCase(iconName)] || null;
    return icon ? (
      <img
        key={`${iconName}-${index}`}
        className="race-inline-effect-icon"
        src={icon}
        alt={iconName}
      />
    ) : (
      iconName
    );
  });
}

function renderEffectLabel(label) {
  return label === EFFECT_LABELS.wit ? (
    <img className="race-effect-label-icon" src={witIcon} alt="WIT" />
  ) : (
    label
  );
}

function normalizeSkillKey(value) {
  return String(value || "").trim().toLowerCase();
}

function firstText(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function snakeCase(value) {
  return String(value || "").replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "");
}

function capitalize(value) {
  const text = String(value || "");
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : "";
}

function prettifyEffectKey(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseDiscordBonusDisplay(value = "") {
  const text = String(value || "");
  if (!text || text === "-") return [];

  const rows = [];
  const bonusPattern = /([+-]?\d+)\s*<:([^:>]+):\d+>/g;
  let match = bonusPattern.exec(text);

  while (match) {
    const [, amount, iconName] = match;
    rows.push({
      icon: DISCORD_BONUS_ICON_MAP[iconName] || BONUS_ICONS.skill,
      index: match.index,
      label: iconName,
      value: signed(amount),
    });
    match = bonusPattern.exec(text);
  }

  return rows;
}

function formatRollDice(value, baseTotal) {
  const text = String(value);
  const markedText = text.replace(/__([^_]+?)__/g, "[$1]");
  if (markedText !== text) return markedText;

  const target = Number(baseTotal);
  if (!Number.isFinite(target)) return text;

  const matches = [...text.matchAll(/\d+/g)];
  const diceValues = matches.map((match) => Number(match[0]));
  if (diceValues.length === 0) return text;

  const selected = findDiceTotalIndexes(diceValues, target);
  if (selected.size === 0) return text;

  let cursor = 0;
  let output = "";
  matches.forEach((match, index) => {
    const [numberText] = match;
    const start = match.index ?? 0;
    output += text.slice(cursor, start);
    output += selected.has(index) ? `[${numberText}]` : numberText;
    cursor = start + numberText.length;
  });
  output += text.slice(cursor);

  return output;
}

function findDiceTotalIndexes(values, target) {
  const selected = [];

  function search(index, remaining) {
    if (remaining === 0) return true;
    if (index >= values.length || remaining < 0) return false;

    selected.push(index);
    if (search(index + 1, remaining - values[index])) return true;
    selected.pop();

    return search(index + 1, remaining);
  }

  return search(0, target) ? new Set(selected) : new Set();
}

function signed(value = 0) {
  const numberValue = Number(value) || 0;
  return numberValue > 0 ? `+${numberValue}` : String(numberValue);
}
