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
  useRaceBlock,
  useRaceRush,
  useRaceSkill,
  useRaceZone,
  witRerollRaceTurn,
} from "../../api/raceApi";
import useRaceSocket from "../../hooks/useRaceSocket";
import gutIcon from "../../assets/icons/Gut.webp";
import powerIcon from "../../assets/icons/Power.webp";
import speedIcon from "../../assets/icons/Speed.webp";
import staminaIcon from "../../assets/icons/Stamina.webp";
import witIcon from "../../assets/icons/Wit.webp";
import skillIcon from "../../assets/skill_icon/Velocity.webp";
import { getRaceImage } from "../../utils/raceSchedule.js";
import "../../styles/raceGamePage.css";

const STYLE_OPTIONS = ["Front", "Pace", "Late", "End"];
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
const LOCAL_MOB_AVATAR_BY_ID = {
  rookie_front: "/mobs/rookie_front.png",
  rookie_pace: "/mobs/rookie_pace.png",
  rookie_late: "/mobs/rookie_late.png",
  rookie_end: "/mobs/rookie_end.png",
  rookie_alt_front: "/mobs/rookie_alt_front.png",
  rookie_alt_pace: "/mobs/rookie_alt_pace.png",
  rookie_alt_late: "/mobs/rookie_alt_late.png",
  rookie_alt_end: "/mobs/rookie_alt_end.png",
  fujimasa_march: "/mobs/fujimasa_march.png",
  beyond_the_light: "/mobs/beyond_the_light.jpg",
  oguri_cap: "/mobs/oguri_cap.png",
  obey_your_master: "/mobs/obey_your_master.jpg",
  orfevre: "/mobs/orfevre.png",
  gentildonna: "/mobs/gentildonna.png",
  verxina: "/mobs/verxina.png",
  still_in_love: "/mobs/still_in_love.png",
  special_week: "/mobs/special_week.png",
  silecne_susuka: "/mobs/silecne_susuka.png",
  almond_eye: "/mobs/almond_eye.png",
  equinox: "/mobs/equinox.png",
};
const LOCAL_MOB_AVATAR_BY_NAME = {
  "almond eye": "/mobs/almond_eye.png",
  "apple cider": "/mobs/mob_01.png",
  "beyond the light": "/mobs/beyond_the_light.jpg",
  "dominant power": "/mobs/mob_03.png",
  equinox: "/mobs/equinox.png",
  "faster than ray": "/mobs/mob_01.png",
  "fujimasa march": "/mobs/fujimasa_march.png",
  gentildonna: "/mobs/gentildonna.png",
  "hexa canyon": "/mobs/mob_03.png",
  "obey your master": "/mobs/obey_your_master.jpg",
  "oguri cap": "/mobs/oguri_cap.png",
  orfevre: "/mobs/orfevre.png",
  "sarasate opera": "/mobs/mob_02.png",
  "shindo runrun": "/mobs/mob_02.png",
  "silecnt susuka": "/mobs/silecne_susuka.png",
  "silecne susuka": "/mobs/silecne_susuka.png",
  "silence suzuka": "/mobs/silecne_susuka.png",
  "sunfish ray": "/mobs/mob_04.png",
  "special week": "/mobs/special_week.png",
  "still in love": "/mobs/still_in_love.png",
  verxina: "/mobs/verxina.png",
  "waltz of shadow": "/mobs/mob_04.png",
};
const LOCAL_MOB_AVATAR_FILES = new Set([
  "almond_eye.png",
  "beyond_the_light.jpg",
  "equinox.png",
  "fujimasa_march.png",
  "gentildonna.png",
  "mob_01.png",
  "mob_02.png",
  "mob_03.png",
  "mob_04.png",
  "obey_your_master.jpg",
  "oguri_cap.png",
  "orfevre.png",
  "rookie_alt_end.png",
  "rookie_alt_front.png",
  "rookie_alt_late.png",
  "rookie_alt_pace.png",
  "rookie_end.png",
  "rookie_front.png",
  "rookie_late.png",
  "rookie_pace.png",
  "silecne_susuka.png",
  "special_week.png",
  "still_in_love.png",
  "verxina.png",
]);
const RACE_STAGE_BG_BY_PATH_TYPE = {
  1: "/race_bg/path_1_bg.png",
  2: "/race_bg/path_2_bg.png",
  3: "/race_bg/path_3_bg.png",
  4: "/race_bg/path_4_bg.png",
  end: "/race_bg/path_end.png",
};

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

function getRaceStageBackground(roomData, fallback) {
  if (!roomData) return { key: "fallback", src: fallback };
  const turn = Number(roomData.turn) || 0;
  const maxTurn = Number(roomData.max_turn) || 0;
  const isFinalTurn = maxTurn > 0 && turn >= maxTurn;
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

function isRaceEnded(roomData) {
  if (!roomData) return false;
  if (roomData.awaiting_turn_confirm) return false;

  return (
    roomData.phase === "ended" ||
    roomData.status === "ended" ||
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
  const [style, setStyle] = useState("Pace");
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [error, setError] = useState("");
  const [showSkills, setShowSkills] = useState(false);
  const [hiddenRoomIds, setHiddenRoomIds] = useState(() => new Set());
  const [selectedBot, setSelectedBot] = useState("rookie_front");
  const [selectedBotLevel, setSelectedBotLevel] = useState(1);
  const [runDiceColorCache, setRunDiceColorCache] = useState({});
  const requestRef = useRef(false);

  const playerPayload = useMemo(
    () => ({
      user_id: String(userId),
      username,
      avatar_url: avatarUrl || "",
      style,
    }),
    [avatarUrl, style, userId, username]
  );

  const handleRoomState = useCallback((nextRoom) => {
    setRoom(nextRoom);
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

  const leaderScore = useMemo(
    () => Math.max(1, ...(room?.scoreboard || []).map((player) => Number(player.score) || 0)),
    [room?.scoreboard]
  );

  const turnProgress = room
    ? Math.min(100, Math.max(0, ((Number(room.turn) || 0) / Math.max(1, Number(room.max_turn) || 1)) * 100))
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
  const myRunDiceColorKey = getRunDiceColorKey(room, myPlayer, room?.turn);
  const myRunDiceColor = useMemo(
    () => runDiceColorCache[myRunDiceColorKey] || getRunnerCurrentDiceColor(myPlayer, room, myLatestRoll),
    [myLatestRoll, myPlayer, myRunDiceColorKey, room, runDiceColorCache]
  );
  const raceRunners = useMemo(
    () => getRaceRunnersByCurrentSpeed(room?.players || [], latestRollByName),
    [latestRollByName, room?.players]
  );
  const raceWinner = useMemo(() => getRaceWinner(room), [room]);

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
      const hiddenIds = new Set([...hiddenRoomIds, ...extraHiddenRoomIds]);
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
      if (nextRoom?.phase === "closed" || shouldCloseAfterLeave) {
        if (shouldCloseAfterLeave && room?.room_id) {
          setHiddenRoomIds((current) => new Set(current).add(room.room_id));
        }
        setRoom(null);
        await refreshRooms(shouldCloseAfterLeave && room?.room_id ? [room.room_id] : []);
      } else {
        setRoom(nextRoom);
      }
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      requestRef.current = false;
      setActionBusy("");
    }
  };

  const handleCreate = () =>
    runAction("create", () => createRaceRoom(playerPayload, selectedStage));

  const handleJoin = (roomItem) =>
    runAction("join", () =>
      roomItem?.is_joined
        ? getRaceRoom(roomItem.room_id, userId)
        : joinRaceRoom(roomItem.room_id, playerPayload)
    );

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

  const handleZone = () =>
    runAction("zone", () => useRaceZone(room.room_id, playerPayload));

  const handleBlock = () =>
    runAction("block", () => useRaceBlock(room.room_id, playerPayload));

  const handleRush = () =>
    runAction("rush", () => useRaceRush(room.room_id, playerPayload));

  if (!room) {
    return (
    <section className={`race-page ${fullscreen ? "race-fullscreen-page" : ""}`}>
        <header className="race-hero">
          <div>
            <span className="race-kicker">Online Race</span>
            <h2>Race Lobby</h2>
          </div>
          <div className="race-toolbar">
            <button type="button" onClick={refreshRooms} disabled={loading}>
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
          <div className="race-style-tabs">
            {STYLE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={style === item ? "active" : ""}
                onClick={() => setStyle(item)}
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
                      Turn {item.max_turn} | {item.player_count} racers
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
      <section className={`race-page race-winner-page ${fullscreen ? "race-fullscreen-page" : ""}`}>
        <RaceWinnerModal winner={raceWinner} onLeave={handleLeave} />
      </section>
    );
  }

  return (
    <section className={`race-page race-hud-page ${fullscreen ? "race-fullscreen-page" : ""}`}>
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
          <strong>{room.distance}</strong>
        </div>

        <div className="race-hud-stat race-hud-turn">
          <span>Turn</span>
          <strong>{room.turn}<small>/{room.max_turn}</small></strong>
          <div><span style={{ width: `${turnProgress}%` }} /></div>
        </div>

        <div className="race-hud-stat">
          <span>Phase</span>
          <strong>{room.race_phase || room.phase}</strong>
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
        </aside>

        <main className="race-hud-panel race-live-panel">
          <div className="race-live-stage">
            <AnimatePresence mode="wait">
              <motion.div
                key={raceStageBackground.key}
                className="race-live-bg"
                style={{ backgroundImage: `url(${raceStageBackground.src})` }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.18 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </AnimatePresence>
            <div className="race-speed-burst" aria-hidden="true">
              {Array.from({ length: 34 }, (_, index) => (
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
              {room.race_phase ? `Phase ${room.race_phase}` : "Race"}
            </div>
            <div className="race-runner-stack uma-scroll">
              {raceRunners.map((player) => {
                const latestRoll = latestRollByName.get(normalizeRaceName(player.name));
                const maxSpeed = getRunnerMaxSpeed(player, room, latestRoll);
                const state = getRunnerState(player, room);
                const avatar = getRunnerAvatar(player);
                return (
                  <motion.article
                    layout
                    className="race-runner-card"
                    key={player.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <div className="race-player-avatar">
                      {avatar ? <img src={avatar} alt="" /> : <Bot size={22} />}
                    </div>
                    <div className="race-runner-info">
                      <div className="race-runner-title-row">
                        <h3>{player.name}</h3>
                        <strong>{maxSpeed}</strong>
                      </div>
                      <div className="race-player-meta">
                        <span><img src={staminaIcon} alt="Stamina" />{player.stamina_left}</span>
                        <span><img src={witIcon} alt="Wit" />{player.wit_mana}</span>
                        <span className={`race-runner-state ${state.className}`}>
                          {state.label}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="race-score-panel race-hud-panel">
          <PanelTitle icon={<Trophy size={16} />} title="Scoreboard" />
          <div className="race-score-list uma-scroll">
            {room.scoreboard?.map((player, index) => {
              const diff = (Number(player.score) || 0) - leaderScore;
              return (
                <motion.div layout className="race-score-row" key={player.id}>
                  <span>{player.rank || index + 1}</span>
                  <strong>{player.name}</strong>
                  <em>{player.style}</em>
                  <b>{player.score}</b>
                  <i className={diff === 0 ? "lead" : ""}>
                    {diff === 0 ? <ChevronUp size={14} /> : diff}
                  </i>
                </motion.div>
              );
            })}
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

        <aside className="race-command-panel race-hud-panel uma-scroll">
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
          ) : isConfirmingTurn ? (
            <>
              <div className="race-confirm-card">
                <span>Turn {room.turn} Result</span>
                <strong>+{latestRollByName.get(normalizeRaceName(myPlayer.name))?.total ?? 0}</strong>
                <p>{hasConfirmedTurn ? "Confirmed. Waiting for racers..." : "Review your score before next turn."}</p>
              </div>
              <button
                type="button"
                className="race-primary-btn race-confirm-btn"
                onClick={handleConfirmTurn}
                disabled={hasConfirmedTurn || Boolean(actionBusy)}
              >
                <Play size={20} />
                {actionBusy === "confirm" ? "Confirming..." : "Confirm Turn"}
              </button>
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
                  onClick={handleBlock}
                  disabled={hasConfirmedTurn || !myPlayer || myPlayer.used_block || Boolean(actionBusy)}
                >
                  Block
                </button>
                <button
                  type="button"
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

                <button
                  type="button"
                  onClick={handleZone}
                  disabled={!myPlayer || myPlayer.zone_left <= 0 || Boolean(actionBusy)}
                >
                  Zone
                </button>
              </div>

           
             
              {showSkills && (
                <div className="race-skill-list uma-scroll">
                  {(myPlayer?.skills || []).map((skill) => (
                    <button
                      key={skill.slot}
                      type="button"
                      disabled={!skill.id || skill.cooldown > 0 || Boolean(actionBusy)}
                      onClick={() => handleSkill(skill)}
                    >
                      <span>Slot {skill.slot}</span>
                      <strong>{skill.name || "Empty"}</strong>
                      <em>
                        {skill.cooldown > 0 ? `CD ${skill.cooldown}` : `${skill.cost || 0} WIT`}
                      </em>
                    </button>
                  ))}
                </div>
              )}
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

function RaceWinnerModal({ winner, onLeave }) {
  const winnerName = winner?.name || winner?.username || "Winner";
  const winnerStyle = winner?.style || winner?.running_style || "-";
  const winnerScore = winner?.score ?? winner?.total_score ?? 0;
  const winnerAvatar = winner?.avatar || getRunnerAvatar(winner);

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
          <strong>{winnerScore} score</strong>
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

  return `Max ${formatCompactNumber(speed)}`;
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
        <p>
          <span>T{log.turn}</span>
          {log.message}
        </p>
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

  return String(log.message || "").replace(/\s+(?:auto\s+)?ran\s+[+-]?\d+.*/i, "").trim() || "Racer";
}

function getScoreFromLogMessage(message = "") {
  const match = String(message).match(/ran\s+\+?(-?\d+)/i);
  return match ? Number(match[1]) : "-";
}

function getRollBonusRows(summary) {
  if (!summary) return [];

  return parseDiscordBonusDisplay(summary.bonus_display);
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
