import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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
const BOT_OPTIONS = [
  { id: "rookie_front", label: "Front" },
  { id: "rookie_pace", label: "Pace" },
  { id: "rookie_late", label: "Late" },
  { id: "rookie_end", label: "End" },
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
            return hasHumanPlayers(detail) ? item : null;
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
              return hasHumanPlayers(detail) ? item : null;
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

  const handleJoin = (roomId) =>
    runAction("join", () => joinRaceRoom(roomId, playerPayload));

  const handleLeave = () =>
    runAction("leave", () => leaveRaceRoom(room.room_id, playerPayload));

  const handleAddBot = (preset) =>
    runAction("bot", () => addRaceBot(room.room_id, playerPayload, preset, 1));

  const handleStart = () =>
    runAction("start", () => startRaceRoom(room.room_id, playerPayload));

  const handleRun = () =>
    runAction("run", () => runRaceTurn(room.room_id, playerPayload));

  const handleConfirmTurn = () =>
    runAction("confirm", () => confirmRaceTurn(room.room_id, playerPayload));

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
                      onClick={() => handleJoin(item.room_id)}
                      disabled={Boolean(actionBusy) || item.phase !== "waiting"}
                    >
                      Join
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
          <div className="race-live-stage" style={{ backgroundImage: `url(${roomRaceImage})` }}>
            <div className="race-live-stage-overlay" />
            <div className="race-phase-banner">
              <Zap size={18} />
              {room.race_phase ? `Phase ${room.race_phase}` : "Race"}
            </div>
            <div className="race-runner-stack uma-scroll">
              {room.players?.map((player) => {
                const latestRoll = latestRollByName.get(normalizeRaceName(player.name));
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
                      {player.avatar ? <img src={player.avatar} alt="" /> : <Bot size={22} />}
                    </div>
                    <div className="race-runner-info">
                      <div className="race-runner-title-row">
                        <h3>{player.name}</h3>
                        <strong>{latestRoll ? `+${latestRoll.total}` : "+0"}</strong>
                      </div>
                      <div className="race-player-meta">
                        <span><img src={staminaIcon} alt="Stamina" />{player.stamina_left}</span>
                        <span><img src={witIcon} alt="Wit" />{player.wit_mana}</span>
                        <span className={player.last_roll_turn === room.turn ? "rolled" : ""}>
                          {player.is_mob ? "Bot" : player.last_roll_turn === room.turn ? "Done" : "Ready"}
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

        <aside className="race-command-panel race-hud-panel">
          {room.phase === "waiting" ? (
            <>
              <div className="race-bot-row">
                {BOT_OPTIONS.map((bot) => (
                  <button
                    key={bot.id}
                    type="button"
                    onClick={() => handleAddBot(bot.id)}
                    disabled={Boolean(actionBusy)}
                  >
                    <Bot size={15} />
                    {bot.label}
                  </button>
                ))}
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
          ) : room.phase === "ended" ? (
            <div className="race-result-panel">
              <Trophy size={24} />
              <h3>{room.result?.winner?.name || "Race Complete"}</h3>
              <p>Winner | {room.result?.winner?.score || 0} score</p>
            </div>
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
                  className="race-primary-btn race-run-btn"
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
    });
  });

  return entries;
}

function normalizeRaceName(value = "") {
  return String(value).trim().toLowerCase();
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

  return String(log.message || "").replace(/\s+ran\s+[+-]?\d+.*/i, "").trim() || "Racer";
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
