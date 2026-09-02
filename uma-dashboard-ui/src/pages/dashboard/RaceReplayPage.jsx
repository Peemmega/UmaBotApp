import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { BOT_API_BASE } from "../../api/playerApi";
import RacePositionTrack from "../../components/RacePositionTrack";
import { resolveRaceAvatar } from "../../utils/avatar";
import "../../styles/raceReplayPage.css";

const LANE_COUNT = 6;
const EMPTY_LIST = [];

function laneCenterY(lane) {
  return 12 + (Math.min(LANE_COUNT, Math.max(1, Number(lane) || 1)) - 1) * 15;
}

function formatAction(action) {
  const data = action?.action_data || action?.action_data_json || {};
  const type = String(action?.action_type || "").toLowerCase();
  if (type === "skill") return `ใช้สกิล ${data.skill_name || data.skill_id || "-"}`;
  if (type === "lane_change" || type === "lane_change_queued") {
    return `เปลี่ยนเลน ${data.from_lane ?? "-"} → ${data.to_lane ?? "-"}`;
  }
  if (type === "zone") return `ใช้ Zone ${data.zone_name || "-"}`;
  if (type === "rush") return `ใช้ Rush +${data.move_forward ?? "-"}`;
  if (type === "block") return `ใช้ Block ${data.move_back ?? "-"}`;
  return data.summary || action?.action_type || "การกระทำ";
}

function participantAvatar(participant, currentProfileImage = "") {
  const snapshot = participant?.snapshot || participant?.snapshot_json || {};
  const savedAvatar = resolveRaceAvatar({
    profile_image_url: currentProfileImage || snapshot.profile_image_url || participant?.profile_image_url,
    avatar: snapshot.avatar_url || snapshot.avatar || participant?.avatar,
    thumbnail: snapshot.thumbnail || participant?.thumbnail,
  }, "");
  if (savedAvatar) return savedAvatar;

  const mobId = String(participant?.mob_id || "");
  return /^[a-z0-9_-]+$/i.test(mobId) ? `/mobs/${mobId}.webp` : "";
}

function buildReplayState(participants, turns, selectedTurn, playerAvatars) {
  const finalDistance = Math.max(
    1,
    ...participants.map((participant) => Number(participant.final_score) || 0),
    ...turns.map((turn) => Number(turn.score_after) || 0),
  );

  const turnsByParticipant = new Map();
  for (const turn of turns) {
    const id = String(turn.participant_id);
    const history = turnsByParticipant.get(id) || [];
    history.push(turn);
    turnsByParticipant.set(id, history);
  }

  const players = participants.map((participant, index) => {
    const history = turnsByParticipant.get(String(participant.participant_id)) || [];
    const completedTurns = history.filter((turn) => Number(turn.turn_number) <= selectedTurn);
    const latest = completedTurns.at(-1);
    const firstTurn = history[0];
    const score = Number(latest?.score_after) || 0;
    return {
      id: participant.participant_id,
      name: participant.uma_name || participant.participant_id,
      display_number: Number(participant.entry_number) || index + 1,
      current_lane: Math.min(LANE_COUNT, Math.max(1, Number(latest?.lane || firstTurn?.lane) || 1)),
      distance: score,
      score,
      progress_ratio: 0.055 + (score / finalDistance) * 0.89,
      rank: Number(latest?.position) || null,
      running_style: participant.running_style,
      track_avatar: participantAvatar(participant, playerAvatars[String(participant.participant_id)]),
      latestTurn: latest,
      finalRank: participant.final_rank,
    };
  });

  const ranked = [...players].sort((left, right) => (
    (left.rank || Number.MAX_SAFE_INTEGER) - (right.rank || Number.MAX_SAFE_INTEGER)
    || right.score - left.score
    || left.display_number - right.display_number
  ));
  ranked.forEach((player, index) => {
    if (!player.rank) player.rank = index + 1;
  });
  return ranked;
}

export default function RaceReplayPage({ raceId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(raceId));
  const [error, setError] = useState(raceId ? "" : "ไม่พบรายการการแข่งขันที่ต้องการดูรีเพลย์");
  const [selectedTurn, setSelectedTurn] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerAvatars, setPlayerAvatars] = useState({});

  useEffect(() => {
    if (!raceId) return undefined;
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/race-history/${encodeURIComponent(raceId)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Could not load race replay")))
      .then((data) => {
        setDetail(data);
        setSelectedTurn(0);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError("ไม่สามารถโหลดข้อมูลรีเพลย์การแข่งขันได้");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [raceId]);

  const race = detail?.race || {};
  const participants = detail?.participants || EMPTY_LIST;
  const turns = detail?.turns || EMPTY_LIST;
  const actions = detail?.actions || EMPTY_LIST;
  const totalTurns = Math.max(Number(race.total_turns) || 0, ...turns.map((turn) => Number(turn.turn_number) || 0), 0);

  useEffect(() => {
    const persistentParticipants = participants.filter((participant) => participant?.uma_id);
    if (!persistentParticipants.length) return undefined;

    let cancelled = false;
    Promise.all(persistentParticipants.map(async (participant) => {
      const response = await fetch(`${BOT_API_BASE}/player/${encodeURIComponent(participant.uma_id)}`);
      if (!response.ok) return [String(participant.participant_id), ""];
      const player = await response.json();
      return [String(participant.participant_id), resolveRaceAvatar(player, "")];
    }))
      .then((entries) => {
        if (!cancelled) setPlayerAvatars(Object.fromEntries(entries.filter(([, avatar]) => avatar)));
      })
      .catch(() => {
        if (!cancelled) setPlayerAvatars({});
      });

    return () => { cancelled = true; };
  }, [participants]);

  useEffect(() => {
    if (!isPlaying || selectedTurn >= totalTurns) return undefined;
    const timer = window.setTimeout(() => {
      const nextTurn = Math.min(selectedTurn + 1, totalTurns);
      setSelectedTurn(nextTurn);
      if (nextTurn >= totalTurns) setIsPlaying(false);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [isPlaying, selectedTurn, totalTurns]);

  const replayPlayers = useMemo(
    () => buildReplayState(participants, turns, selectedTurn, playerAvatars),
    [participants, playerAvatars, selectedTurn, turns],
  );
  const participantById = useMemo(
    () => new Map(participants.map((participant) => [String(participant.participant_id), participant])),
    [participants],
  );
  const turnEvents = useMemo(() => {
    if (selectedTurn === 0) return [];
    const movement = turns
      .filter((turn) => Number(turn.turn_number) === selectedTurn)
      .map((turn) => ({
        type: "move",
        id: `move-${turn.participant_id}`,
        participant: participantById.get(String(turn.participant_id)),
        turn,
      }));
    const actionEvents = actions
      .filter((action) => Number(action.turn_number) === selectedTurn)
      .map((action) => ({
        type: "action",
        id: `action-${action.action_id}`,
        participant: participantById.get(String(action.participant_id)),
        action,
      }));
    return [...movement, ...actionEvents];
  }, [actions, participantById, selectedTurn, turns]);

  const goToTurn = (turn) => {
    setIsPlaying(false);
    setSelectedTurn(Math.min(totalTurns, Math.max(0, turn)));
  };

  if (loading) return <section className="race-replay-loading">กำลังโหลดรีเพลย์การแข่งขัน...</section>;
  if (error) return <section className="race-replay-loading is-error">{error}<button type="button" onClick={onBack}>กลับหน้าสนามแข่ง</button></section>;

  return (
    <section className="race-replay-page" aria-label="รีเพลย์การแข่งขัน">
      <header className="race-replay-header">
        <button type="button" className="race-replay-back" onClick={onBack}><ChevronLeft size={18} /> กลับ</button>
        <div>
          <span>RACE REPLAY</span>
          <h1>{race.stage_name || race.race_name || "การแข่งขัน"}</h1>
          <p>{race.track || "-"} · {race.distance || "-"} · ผู้เข้าแข่งขัน {participants.length} คน</p>
        </div>
        <div className="race-replay-turn-counter"><Flag size={17} /> เทิร์น {selectedTurn} / {totalTurns}</div>
      </header>

      <div className="race-replay-layout">
        <aside className="race-replay-log-panel">
          <h2><ListChecks size={17} /> Race log</h2>
          <p className="race-replay-panel-caption">{selectedTurn === 0 ? "ตำแหน่งก่อนเริ่มการแข่งขัน" : `เหตุการณ์ในเทิร์น ${selectedTurn}`}</p>
          <div className="race-replay-log-list">
            {turnEvents.length ? turnEvents.map((event) => event.type === "move" ? (
              <article className="race-replay-log-entry" key={event.id}>
                <b>{event.participant?.uma_name || event.turn.participant_id}</b>
                <span>เคลื่อนที่ +{event.turn.run_score ?? 0} · เลน {event.turn.lane ?? "-"}</span>
                <em>คะแนนรวม {Number(event.turn.score_after || 0).toLocaleString()} · อันดับ #{event.turn.position ?? "-"}</em>
              </article>
            ) : (
              <article className="race-replay-log-entry is-action" key={event.id}>
                <b>{event.participant?.uma_name || event.action.participant_id}</b>
                <span>{formatAction(event.action)}</span>
              </article>
            )) : <p className="race-replay-empty">เริ่มต้นที่เส้นสตาร์ต</p>}
          </div>
        </aside>

        <main className="race-replay-track-panel">
          <div className="race-replay-track-header"><span>START</span><strong>{selectedTurn === totalTurns && totalTurns ? "FINISH" : `TURN ${selectedTurn}`}</strong><span>FINISH</span></div>
          <div className="race-replay-stage">
            {/* <img src={raceBackground(race)} alt="สนามแข่ง" /> */}
            <div className="race-replay-stage-shade" />
            <div className="race-replay-lane-guides" aria-hidden="true">
              {Array.from({ length: LANE_COUNT }, (_, index) => (
                <span key={index} style={{ "--lane-y": `${laneCenterY(index + 1)}%` }} />
              ))}
            </div>
            <RacePositionTrack players={replayPlayers} />
            <div className="race-replay-lane-labels" aria-hidden="true">
              {Array.from({ length: LANE_COUNT }, (_, index) => (
                <span key={index} style={{ "--lane-y": `${laneCenterY(index + 1)}%` }}>Lane {index + 1}</span>
              ))}
            </div>
          </div>
          <div className="race-replay-controls">
            <button type="button" onClick={() => goToTurn(0)} aria-label="กลับไปเริ่มต้น"><RotateCcw size={18} /></button>
            <button type="button" onClick={() => goToTurn(selectedTurn - 1)} disabled={selectedTurn === 0} aria-label="เทิร์นก่อนหน้า"><ChevronLeft size={20} /></button>
            <button type="button" className="race-replay-play" onClick={() => setIsPlaying((value) => !value)} disabled={selectedTurn >= totalTurns}>
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />} {isPlaying ? "หยุดชั่วคราว" : "เล่นรีเพลย์"}
            </button>
            <button type="button" onClick={() => goToTurn(selectedTurn + 1)} disabled={selectedTurn >= totalTurns} aria-label="เทิร์นถัดไป"><ChevronRight size={20} /></button>
          </div>
          <div className="race-replay-timeline" aria-label="เลือกเทิร์น">
            <button type="button" className={selectedTurn === 0 ? "active" : ""} onClick={() => goToTurn(0)}>Start</button>
            {Array.from({ length: totalTurns }, (_, index) => {
              const turn = index + 1;
              return <button type="button" key={turn} className={selectedTurn === turn ? "active" : ""} onClick={() => goToTurn(turn)}>T{turn}</button>;
            })}
          </div>
        </main>

        <aside className="race-replay-score-panel">
          <h2><Trophy size={17} /> Scoreboard</h2>
          <p className="race-replay-panel-caption">อันดับ ณ เทิร์น {selectedTurn}</p>
          <ol className="race-replay-score-list">
            {replayPlayers.map((player) => (
              <li key={player.id} className={player.rank === 1 ? "is-leading" : ""}>
                <strong>#{player.rank}</strong>
                <span className="race-replay-avatar">
                  {player.track_avatar ? <img src={player.track_avatar} alt="" /> : String(player.name || "?").slice(0, 1)}
                </span>
                <span><b>{player.name}</b><small>เลน {player.current_lane} · {player.running_style || "Pace"}</small></span>
                <em>{Number(player.score).toLocaleString()}</em>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
