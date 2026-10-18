import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Flag, Focus, ListChecks, Pause, Play, RotateCcw, X } from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import staminaIcon from "../../assets/icons/Stamina.webp";
import RacePositionTrack from "../../components/RacePositionTrack";
import { resolveRaceAvatar } from "../../utils/avatar";
import { buildReplayTransition, getReplayTurnData, groupReplayEvents } from "../../utils/raceReplay";
import "../../styles/raceReplayPage.css";

const EMPTY_LIST = [];
const number = (value) => Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 1 });
const signed = (value) => `${Number(value) >= 0 ? "+" : ""}${number(value)}`;
const laneCenterY = (lane) => 12 + (lane - 1) * 15;
const formatRaceDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
};
const PHASE_LABELS = {
  lane: "เริ่มเทิร์น · เปลี่ยนเลน",
  run: "หลังวิ่งจบเทิร์น",
};

function participantAvatar(participant, currentProfileImage = "") {
  const snapshot = participant?.snapshot || participant?.snapshot_json || {};
  const avatar = resolveRaceAvatar({
    profile_image_url: currentProfileImage || snapshot.profile_image_url || participant?.profile_image_url,
    avatar: snapshot.avatar_url || snapshot.avatar || participant?.avatar,
    thumbnail: snapshot.thumbnail || participant?.thumbnail,
  }, "");
  if (avatar) return avatar;
  const mobId = String(participant?.mob_id || "");
  return /^[a-z0-9_-]+$/i.test(mobId) ? `/mobs/${mobId}.webp` : "";
}

function RunnerAvatar({ player }) {
  return <span className="replay-runner-avatar" data-pack={player.pack_state}>
    {player.track_avatar ? <img src={player.track_avatar} alt="" /> : player.name.slice(0, 1)}
    <small>{player.display_number}</small>
  </span>;
}

export default function RaceReplayPage({ raceId, onBack }) {
  const [request, setRequest] = useState({ raceId: null, detail: null, error: "" });
  const [selectedTurn, setSelectedTurn] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState("all");
  const [replayPhase, setReplayPhase] = useState("lane");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerAvatars, setPlayerAvatars] = useState({});
  const activeTurnRef = useRef(null);
  const runnerListRef = useRef(null);

  useEffect(() => {
    if (!raceId) return undefined;
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/race-history/${encodeURIComponent(raceId)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load race replay")))
      .then((detail) => {
        if (controller.signal.aborted) return;
        setRequest({ raceId, detail, error: "" });
        const loadedTurns = detail?.turns || EMPTY_LIST;
        const loadedTotalTurns = Math.max(Number(detail?.race?.total_turns) || 0, ...loadedTurns.map((turn) => Number(turn.turn_number) || 0), 0);
        setSelectedTurn(loadedTotalTurns > 0 ? 1 : 0);
        setIsPlaying(false);
        setReplayPhase(loadedTotalTurns > 0 ? "lane" : "run");
        setSelectedPlayerId(null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setRequest({ raceId, detail: null, error: "โหลดรีเพลย์ไม่สำเร็จ กรุณาลองเปิดการแข่งขันนี้อีกครั้ง" });
      });
    return () => controller.abort();
  }, [raceId]);

  const detail = request.raceId === raceId ? request.detail : null;
  const loading = Boolean(raceId && request.raceId !== raceId);
  const race = detail?.race || {};
  const participants = detail?.participants || EMPTY_LIST;
  const turns = detail?.turns || EMPTY_LIST;
  const actions = detail?.actions || EMPTY_LIST;
  const totalTurns = Math.max(Number(race.total_turns) || 0, ...turns.map((turn) => Number(turn.turn_number) || 0), 0);

  useEffect(() => {
    const controller = new AbortController();
    const persistentParticipants = participants.filter((participant) => participant?.uma_id);
    Promise.allSettled(persistentParticipants.map(async (participant) => {
      const response = await fetch(`${BOT_API_BASE}/player/${encodeURIComponent(participant.uma_id)}`, { signal: controller.signal });
      if (!response.ok) return [String(participant.participant_id), ""];
      return [String(participant.participant_id), resolveRaceAvatar(await response.json(), "")];
    })).then((results) => {
      if (!controller.signal.aborted) setPlayerAvatars(Object.fromEntries(results
        .filter((result) => result.status === "fulfilled" && result.value[1])
        .map((result) => result.value)));
    });
    return () => controller.abort();
  }, [participants]);

  useEffect(() => {
    if (!isPlaying || loading || !totalTurns) return undefined;
    const phaseDuration = replayPhase === "lane" ? 1050 : 750;
    const timer = window.setTimeout(() => {
      if (replayPhase === "lane") {
        setReplayPhase("run");
        return;
      }
      if (playMode === "turn" || selectedTurn >= totalTurns) {
        setIsPlaying(false);
        return;
      }
      setSelectedTurn((turn) => Math.min(turn + 1, totalTurns));
      setReplayPhase("lane");
    }, phaseDuration / playbackSpeed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, loading, playMode, playbackSpeed, replayPhase, selectedTurn, totalTurns]);

  const replayTransition = useMemo(() => {
    const avatars = Object.fromEntries(participants.map((participant) => [
      String(participant.participant_id), participantAvatar(participant, playerAvatars[String(participant.participant_id)]),
    ]));
    return buildReplayTransition(participants, turns, selectedTurn, avatars);
  }, [participants, playerAvatars, selectedTurn, turns]);
  const replayPlayers = replayTransition[replayPhase] || replayTransition.run;
  const eventsByPlayer = useMemo(() => groupReplayEvents(replayTransition.run, actions, selectedTurn), [replayTransition.run, actions, selectedTurn]);
  const turnPlayerById = useMemo(() => new Map(replayTransition.run.map((player) => [player.id, player])), [replayTransition.run]);
  const actionCountByTurn = useMemo(() => {
    const counts = new Map();
    actions.forEach((action) => {
      const turnNumber = Number(action.turn_number);
      const displayTurn = String(action.action_type || "").toLowerCase() === "lane_change"
        ? turnNumber + 1
        : turnNumber;
      counts.set(displayTurn, (counts.get(displayTurn) || 0) + 1);
    });
    turns.forEach((turn) => {
      if (getReplayTurnData(turn).skills?.length && !counts.has(Number(turn.turn_number))) counts.set(Number(turn.turn_number), 1);
    });
    return counts;
  }, [actions, turns]);
  const selectedPlayer = replayPlayers.find((player) => player.id === selectedPlayerId);
  const visiblePlayers = useMemo(() => {
    if (!selectedPlayerId) return replayPlayers;
    return [...replayPlayers].sort((left, right) => (
      left.id === selectedPlayerId ? -1 : right.id === selectedPlayerId ? 1 : 0
    ));
  }, [replayPlayers, selectedPlayerId]);

  useEffect(() => {
    const active = activeTurnRef.current;
    const container = active?.parentElement;
    if (!active || !container) return;
    const left = active.offsetLeft - container.offsetLeft;
    if (left < container.scrollLeft || left + active.offsetWidth > container.scrollLeft + container.clientWidth) {
      container.scrollLeft = left - container.clientWidth / 2 + active.offsetWidth / 2;
    }
  }, [selectedTurn]);

  useEffect(() => {
    const container = runnerListRef.current;
    const row = container?.querySelector('[data-selected="true"]');
    if (!row) return;
    const top = row.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    if (top < container.scrollTop || top + row.offsetHeight > container.scrollTop + container.clientHeight) container.scrollTop = top;
  }, [selectedPlayerId, selectedTurn]);

  const goToTurn = (turn, phase) => {
    const nextTurn = totalTurns > 0 ? Math.min(totalTurns, Math.max(1, turn)) : 0;
    setIsPlaying(false);
    setSelectedTurn(nextTurn);
    setReplayPhase(phase || "lane");
  };
  const choosePhase = (phase) => {
    setIsPlaying(false);
    setReplayPhase(phase);
  };
  const startPlayback = (mode = "all") => {
    const firstTurn = selectedTurn >= totalTurns ? 1 : Math.max(1, selectedTurn);
    setPlayMode(mode);
    setSelectedTurn(firstTurn);
    setReplayPhase("lane");
    setIsPlaying(true);
  };
  const selectPlayer = (id) => {
    setSelectedPlayerId((current) => current === String(id) ? null : String(id));
  };
  useEffect(() => {
    const handleTurnKey = (event) => {
      if (event.repeat || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (key === "a" && selectedTurn > 1) {
        event.preventDefault();
        goToTurn(selectedTurn - 1);
      } else if (key === "d" && totalTurns > 0 && selectedTurn < totalTurns) {
        event.preventDefault();
        goToTurn(selectedTurn + 1);
      }
    };
    window.addEventListener("keydown", handleTurnKey);
    return () => window.removeEventListener("keydown", handleTurnKey);
  }, [selectedTurn, totalTurns]);

  if (loading) return <section className="replay-empty" aria-live="polite"><Flag size={32} /><h1>กำลังเตรียมรีเพลย์</h1><p>กำลังโหลดตำแหน่งและเหตุการณ์ในการแข่งขัน</p></section>;
  if (!raceId || request.error) return <section className="replay-empty">
    <Flag size={32} /><h1>{raceId ? "ยังเปิดรีเพลย์ไม่ได้" : "เลือกการแข่งขันที่อยากดูอีกครั้ง"}</h1>
    <p>{raceId ? request.error : "เปิดรีเพลย์จากประวัติการแข่งขัน เพื่อดูตำแหน่งและการกระทำในแต่ละเทิร์น"}</p>
    <button type="button" onClick={onBack}><ChevronLeft size={17} /> กลับหน้าสนามแข่ง</button>
  </section>;

  return <section className="race-replay-page" aria-label="รีเพลย์การแข่งขัน">
    <div className="replay-workspace">
      <div className="replay-field-column">
        <section className="replay-field" aria-labelledby="replay-field-title">
          <div className="replay-race-title">
            <h1>{race.stage_name || race.race_name || "รีเพลย์การแข่งขัน"} {formatRaceDate(race.started_at || race.created_at) || "ไม่ระบุวันที่"}</h1>
          </div>
          <div className="replay-field-axis"><span>ท้ายสุด <b>{number(replayPlayers.at(-1)?.score)}</b></span><span>คะแนนสะสม</span><span><b>{number(replayPlayers[0]?.score)}</b> ผู้นำ <ArrowRight size={14} /></span></div>
          <div className={`race-replay-stage${selectedPlayer ? " has-selection" : ""}`}>
            <div className="replay-lane-bands" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} style={{ "--lane-y": `${laneCenterY(index + 1)}%` }} />)}</div>
            <div className="replay-lane-labels" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} style={{ "--lane-y": `${laneCenterY(index + 1)}%` }}><small>เลน</small>{index + 1}</span>)}</div>
            <RacePositionTrack players={replayPlayers} selectedPlayerId={selectedPlayerId} onSelectPlayer={selectPlayer} label="ตำแหน่งตัวละครจากท้ายสุดถึงผู้นำ" />
          </div>
          <div className="replay-field-key"><span><i data-pack="in" /> อยู่ในกลุ่ม</span><span><i data-pack="out" /> ออกนอกกลุ่ม</span>
            <details><summary>อ่านสนามอย่างไร</summary><p>ซ้ายคือคะแนนน้อยสุด ขวาคือคะแนนมากสุดในเทิร์นนี้ หากคะแนนเท่ากันจะอยู่ตำแหน่งเดียวกัน<br />ขอบสีแสดงสถานะกลุ่มตอนวิ่งที่บันทึกไว้ในเทิร์น หากไม่มีบันทึก จะอิงระยะห่างไม่เกิน 20 คะแนนและเลนห่างไม่เกิน 1 เลน</p></details>
          </div>
          
        </section>

        <section className="replay-playback" aria-label="ควบคุมรีเพลย์">
          <div className="replay-phase-controls" aria-label="ดูช่วงของเทิร์น">
            <button type="button" className={replayPhase === "lane" ? "is-active" : ""} onClick={() => choosePhase("lane")} disabled={!totalTurns}>เริ่มเทิร์น</button>
            <button type="button" className={replayPhase === "run" ? "is-active" : ""} onClick={() => choosePhase("run")} disabled={!totalTurns}>หลังวิ่ง</button>
          </div>
          <div className="replay-playback-toolbar">
            <div className="replay-transport">
              <button type="button" onClick={() => goToTurn(1)} disabled={selectedTurn <= 1 || !totalTurns} aria-label="กลับไปเทิร์นแรก"><RotateCcw size={17} /></button>
              <button type="button" className="replay-key-control" onClick={() => goToTurn(selectedTurn - 1)} disabled={selectedTurn <= 1 || !totalTurns} aria-label="ย้อนกลับเทิร์นด้วย A"><kbd>A</kbd></button>
              <button type="button" onClick={() => goToTurn(selectedTurn - 1)} disabled={selectedTurn <= 1 || !totalTurns} aria-label="เทิร์นก่อนหน้า"><ChevronLeft size={20} /></button>
              <button type="button" className="replay-play" onClick={() => {
                if (isPlaying) setIsPlaying(false);
                else startPlayback("all");
              }} disabled={totalTurns === 0}>
                {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}{isPlaying ? "พัก" : "เล่นรีเพลย์"}
              </button>
              <button type="button" onClick={() => goToTurn(selectedTurn + 1)} disabled={selectedTurn >= totalTurns || !totalTurns} aria-label="เทิร์นถัดไป"><ChevronRight size={20} /></button>
              <button type="button" className="replay-key-control" onClick={() => goToTurn(selectedTurn + 1)} disabled={selectedTurn >= totalTurns || !totalTurns} aria-label="ไปเทิร์นถัดไปด้วย D"><kbd>D</kbd></button>
            </div>
            <div className="replay-playback-actions"><button type="button" className="replay-turn-play" onClick={() => (isPlaying ? setIsPlaying(false) : startPlayback("turn"))} disabled={totalTurns === 0}>{isPlaying && playMode === "turn" ? "พักเทิร์น" : "เล่นเทิร์นนี้"}</button><label className="replay-speed">ความเร็ว<select aria-label="ความเร็วรีเพลย์" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(Number(event.target.value))}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label></div>
          </div>
          <label className="replay-scrubber"><span>เทิร์น {selectedTurn}</span><input type="range" min={1} max={totalTurns} value={Math.max(1, selectedTurn)} disabled={!totalTurns} onChange={(event) => goToTurn(Number(event.target.value))} aria-label="เลื่อนไปยังเทิร์น" aria-valuetext={`เทิร์น ${selectedTurn} จาก ${totalTurns}`} /><span>จบ</span></label>
          <div className="replay-turn-list" aria-label="เลือกเทิร์น">{Array.from({ length: totalTurns }, (_, index) => index + 1).map((turn) => <button type="button" key={turn} ref={selectedTurn === turn ? activeTurnRef : null} className={selectedTurn === turn ? "is-current" : ""} aria-current={selectedTurn === turn ? "step" : undefined} onClick={() => goToTurn(turn)} title={`เทิร์น ${turn} · ${actionCountByTurn.get(turn) || 0} การกระทำ`}><span>{turn}</span><i className={actionCountByTurn.get(turn) ? "has-events" : ""} /></button>)}</div>
        </section>
      </div>

      <aside className="replay-runners" aria-labelledby="replay-runners-title">
        <header className="replay-runners-heading"><div><h2 id="replay-runners-title">ลำดับคะแนน</h2></div><span>{visiblePlayers.length} คน</span></header>
        <div className="replay-runner-list" ref={runnerListRef}>
          {visiblePlayers.map((player) => {
            const events = eventsByPlayer.get(player.id) || [];
            const turnPlayer = turnPlayerById.get(player.id);
            const turn = turnPlayer?.latestTurn;
            const staminaBefore = turn?.stamina_before ?? turnPlayer?.roll.stamina?.before;
            const staminaAfter = turn?.stamina_after ?? turnPlayer?.roll.stamina?.current_stamina;
            const isSelected = selectedPlayerId === player.id;
            return <article className="replay-runner" key={player.id} data-selected={isSelected}>
              <button type="button" className="replay-runner-select" onClick={() => selectPlayer(player.id)} aria-pressed={isSelected} aria-label={`ติดตาม ${player.name} อันดับ ${player.rank}`}>
                <span className="replay-runner-rank">{player.rank}<small>อันดับ</small></span><RunnerAvatar player={player} /><span className="replay-runner-name"><strong>{player.name}</strong><small>{player.running_style || "ไม่ระบุสายวิ่ง"} <span>·</span> เลน {player.current_lane}</small></span><span className="replay-runner-score"><strong>{number(player.score)}</strong><small>คะแนน</small></span>
              </button>
              <div className="replay-runner-content">
                <div className="replay-runner-facts"><span className="replay-phase-chip" data-phase={replayPhase}>{PHASE_LABELS[replayPhase]}</span><span className="replay-pack" data-pack={player.pack_state} title={player.pack_source === "recorded" ? "สถานะตอนวิ่งที่บันทึกไว้ในเทิร์น" : "คำนวณจากตำแหน่งที่มีในรีเพลย์"}><i />{player.pack_state === "in" ? "อยู่ในกลุ่ม" : "นอกกลุ่ม"}</span>{replayPhase === "lane" && player.lane_changed && <span>เลน {player.lane_before} → {player.lane_after}</span>}{replayPhase === "run" && turn ? <span>คะแนน {signed(Number(turn.score_after) - Number(turn.score_before))}</span> : null}{player.gap_to_leader > 0 && <span>ตาม {number(player.gap_to_leader)}</span>}</div>
                {events.length ? <ul className="replay-actions">{events.map((event) => <li key={event.id} data-incoming={Boolean(event.incoming)}><span className={`replay-event-dot is-${event.type}`} /><div>{event.incoming && <small>รับผลจาก {event.actor}</small>}<span>{event.label}</span>{event.type === "blocked" && event.runLane != null && <small className="replay-event-context">เกิดขึ้นในเลน {event.runLane}{event.laneChanged && event.nextLane != null ? ` → เลน ${event.nextLane} หลังเทิร์น` : ""}{event.blockedRunnerNames?.length ? ` · นับ ${event.blockedRunnerNames.join(", ")}` : ""}</small>}{event.target && <small><ArrowRight size={12} /> {event.target}</small>}</div></li>)}</ul> : <p className="replay-no-actions">ไม่มีการกระทำเพิ่มเติมในเทิร์นนี้</p>}
                {turn && <details className="replay-run-details" open={isSelected || undefined} key={`${player.id}-${selectedTurn}-${isSelected}`}><summary>ข้อมูลการวิ่ง{staminaAfter != null && <span className="replay-stamina-value"><img src={staminaIcon} alt="Stamina" />{number(staminaAfter)}</span>}</summary><dl><div><dt>ผลวิ่ง</dt><dd>{turn.run_score == null ? "ไม่ได้บันทึก" : signed(turn.run_score)}</dd></div><div><dt>คะแนนสะสม</dt><dd>{number(turn.score_before)} → {number(turn.score_after)}</dd></div>{staminaBefore != null && staminaAfter != null && <div><dt><img className="replay-stamina-icon" src={staminaIcon} alt="Stamina" /></dt><dd>{number(staminaBefore)} → {number(staminaAfter)}</dd></div>}{turnPlayer?.roll.rule && <div><dt>เต๋าที่ใช้</dt><dd>{typeof turnPlayer.roll.rule === "string" ? turnPlayer.roll.rule : `${turnPlayer.roll.rule.d || 0}d`}</dd></div>}</dl></details>}
              </div>
            </article>;
          })}
          {!visiblePlayers.length && <div className="replay-no-results"><ListChecks size={27} /><p>ไม่มีข้อมูลผู้เข้าแข่งขัน</p></div>}
        </div>
      </aside>
    </div>
    <header className="replay-heading">
      <button type="button" className="replay-back" onClick={onBack}><ChevronLeft size={18} /> กลับสนามแข่ง</button>
    </header>
  </section>;
}
