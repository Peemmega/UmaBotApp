import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  DoorOpen,
  Flag,
  Gauge,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  addRaceBot,
  createRaceRoom,
  getRaceRoom,
  joinRaceRoom,
  leaveRaceRoom,
  listRaceRooms,
  listRaceStages,
  runRaceTurn,
  startRaceRoom,
  useRaceBlock,
  useRaceRush,
  useRaceSkill,
  useRaceZone,
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
  { id: "rookie_front", label: "Front Bot" },
  { id: "rookie_pace", label: "Pace Bot" },
  { id: "rookie_late", label: "Late Bot" },
  { id: "rookie_end", label: "End Bot" },
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

export default function RaceGamePage({
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
    myPlayer &&
    !myPlayer.is_mob &&
    myPlayer.last_roll_turn !== room.turn;

  const roomRaceImage = useMemo(
    () => getRaceImage(roomRaceImageSource(room)),
    [room]
  );

  const refreshRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listRaceRooms();
      setRooms(data.rooms || []);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([listRaceStages(), listRaceRooms()])
      .then(([raceData, roomData]) => {
        if (!mounted) return;
        const nextStages = raceData || [];
        setStages(nextStages);
        if (nextStages.some((stage) => stage.id === "Debut")) {
          setSelectedStage("Debut");
        } else if (nextStages[0]?.id) {
          setSelectedStage(nextStages[0].id);
        }
        setRooms(roomData.rooms || []);
      })
      .catch((err) => setError(String(err.message || err)));
    return () => {
      mounted = false;
    };
  }, []);

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
      const nextRoom = await action();
      if (nextRoom?.phase === "closed") {
        setRoom(null);
        refreshRooms();
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
      <section className="race-page">
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
                      Turn {item.turn}/{item.max_turn} | {item.player_count} racers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoin(item.room_id)}
                    disabled={Boolean(actionBusy) || item.phase !== "waiting"}
                  >
                    Join
                  </button>
                </article>
              );
            })
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="race-page">
      <header className="race-hero room">
        <div>
          <span className="race-kicker">{room.phase}</span>
          <h2>{room.race_name}</h2>
          <p>
            Turn {room.turn}/{room.max_turn} | Phase {room.race_phase} |{" "}
            {socketStatus}
          </p>
        </div>
        <button type="button" className="race-ghost-btn" onClick={handleLeave}>
          <DoorOpen size={16} />
          Leave
        </button>
      </header>

      {error && <div className="race-error">{error}</div>}

      <div className="race-game-grid">
        <div className="race-track-panel">
          <img className="race-track-image" src={roomRaceImage} alt="" />
          <div className="race-path-strip" aria-label="Track path">
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
          <div className="race-status-panel">
            <div>
              <Flag size={17} />
              <span>{room.current_path?.label}</span>
            </div>
            <div>
              <Gauge size={17} />
              <span>{room.distance} | {room.track}</span>
            </div>
          </div>
        </div>

        <aside className="race-score-panel">
          <h3>
            <Trophy size={18} />
            Scoreboard
          </h3>
          <div className="race-score-list">
            {room.scoreboard?.map((player) => (
              <div className="race-score-row" key={player.id}>
                <span>{player.rank}</span>
                <strong>{player.name}</strong>
                <em>{player.style}</em>
                <b>{player.score}</b>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="race-action-layout">
        <div className="race-player-grid">
          {room.players?.map((player) => (
            <article className="race-player-card" key={player.id}>
              <div className="race-player-avatar">
                {player.avatar ? <img src={player.avatar} alt="" /> : <Bot size={22} />}
              </div>
              <div>
                <h3>{player.name}</h3>
                <p className="race-player-meta">
                  <span>{player.style}</span>
                  <span>
                    <img src={staminaIcon} alt="Stamina" />
                    {player.stamina_left}
                  </span>
                  <span>
                    <img src={witIcon} alt="Wit" />
                    {player.wit_mana}
                  </span>
                </p>
                <div className="race-progress">
                  <span
                    style={{
                      width: `${Math.min(100, Math.max(4, (player.score / Math.max(1, room.scoreboard?.[0]?.score || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
              <span className={player.last_roll_turn === room.turn ? "rolled" : ""}>
                {player.is_mob ? "Bot" : player.last_roll_turn === room.turn ? "Done" : "Ready"}
              </span>
            </article>
          ))}
        </div>

        <aside className="race-command-panel">
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
                className="race-primary-btn"
                onClick={handleStart}
                disabled={String(room.owner_id) !== String(userId) || Boolean(actionBusy)}
              >
                <Play size={17} />
                Start
              </button>
            </>
          ) : room.phase === "ended" ? (
            <div className="race-result-panel">
              <Trophy size={24} />
              <h3>{room.result?.winner?.name || "Race Complete"}</h3>
              <p>Winner | {room.result?.winner?.score || 0} score</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="race-primary-btn"
                onClick={handleRun}
                disabled={!canRun || Boolean(actionBusy)}
              >
                <Flag size={17} />
                {actionBusy === "run" ? "Running..." : "Run"}
              </button>
              <button
                type="button"
                className="race-skill-toggle"
                onClick={() => setShowSkills((value) => !value)}
              >
                <Sparkles size={17} />
                Skill
              </button>
              <div className="race-special-actions">
                <button
                  type="button"
                  onClick={handleZone}
                  disabled={!myPlayer || myPlayer.zone_left <= 0 || Boolean(actionBusy)}
                >
                  Zone
                </button>
                <button
                  type="button"
                  onClick={handleBlock}
                  disabled={!myPlayer || myPlayer.used_block || Boolean(actionBusy)}
                >
                  Block
                </button>
                <button
                  type="button"
                  onClick={handleRush}
                  disabled={!myPlayer || myPlayer.used_rush || Boolean(actionBusy)}
                >
                  Rush
                </button>
              </div>
              {showSkills && (
                <div className="race-skill-list">
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

      <section className="race-log-panel">
        <h3>Action Log</h3>
        <div className="race-log-list">
          {(room.action_logs || []).slice().reverse().map((log) => (
            <RaceLogItem key={log.id} log={log} />
          ))}
        </div>
      </section>
    </section>
  );
}

function RaceLogItem({ log }) {
  const summary = log.payload?.roll_summary;
  const bonusRows = getRollBonusRows(summary);

  return (
    <article className="race-log-item">
      <p>
        <span>T{log.turn}</span>
        {log.message}
      </p>
      {summary && (
        <div className="race-log-detail">
          <div>
            <b>Roll</b>
            <span>
              {formatRollDice(summary.dice || summary.base_total || "-")} = {summary.total ?? "-"}
              {summary.distance_color ? ` | ${summary.distance_color}` : ""}
            </span>
          </div>
          <div>
            <b>Bonus</b>
            <span className="race-log-bonus-list">
              {bonusRows.length > 0
                ? bonusRows.map((item) => (
                    <em key={`${item.label}-${item.value}-${item.index}`}>
                      {item.icon && <img src={item.icon} alt={item.label} />}
                      {item.note && <span>{item.note}</span>}
                      <strong>{item.value}</strong>
                    </em>
                  ))
                : <em>No bonus</em>}
            </span>
          </div>
        </div>
      )}
    </article>
  );
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

function formatRollDice(value) {
  return String(value).replace(/__/g, "");
}

function signed(value = 0) {
  const numberValue = Number(value) || 0;
  return numberValue > 0 ? `+${numberValue}` : String(numberValue);
}
