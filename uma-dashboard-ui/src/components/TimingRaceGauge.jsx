import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const ACTIVE_RESET_GRACE_MS = 1000;
const DEFAULT_TIMING_CONFIG = {
  countdown_steps: ["3", "2", "1", "GO!"],
  countdown_step_ms: 780,
  go_hold_ms: 520,
  start_delay_ms: 500,
  min_half_cycle_ms: 520,
  default_half_cycle_ms: 1450,
};

function getTier(score) {
  if (score >= 0.92) return "Perfect";
  if (score >= 0.78) return "Great";
  if (score >= 0.55) return "Good";
  if (score >= 0.3) return "Bad";
  return "Miss";
}

function isTypingTarget(target) {
  const tagName = target?.tagName?.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    Boolean(target?.isContentEditable)
  );
}

export default function TimingRaceGauge({
  active,
  gauge,
  timingConfig,
  runningStyle,
  onSubmit,
}) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [direction, setDirection] = useState(1);
  const [cycleId, setCycleId] = useState(1);
  const [submittedCycleId, setSubmittedCycleId] = useState(null);
  const [hitStamps, setHitStamps] = useState([]);
  const animationRef = useRef(0);
  const trackRef = useRef(null);
  const markerRef = useRef(null);
  const trackWidthRef = useRef(0);
  const lastFrameRef = useRef(0);
  const positionRef = useRef(0);
  const directionRef = useRef(1);
  const cycleRef = useRef(1);
  const submittedCycleRef = useRef(null);
  const hasSubmittedTimingRef = useRef(false);
  const config = { ...DEFAULT_TIMING_CONFIG, ...timingConfig };
  const countdownStepsKey = config.countdown_steps.join("|");
  const countdownSteps = useMemo(() => countdownStepsKey.split("|"), [countdownStepsKey]);
  const countdownStepMs = Number(config.countdown_step_ms);
  const goHoldMs = Number(config.go_hold_ms);
  const timingStartDelayMs = Number(config.start_delay_ms);
  const halfCycleMs = Math.max(
    Number(config.min_half_cycle_ms),
    Number(gauge?.half_cycle_ms) || Number(config.default_half_cycle_ms)
  );
  const tempoLevel = gauge?.tempo_level || "N";
  const zoneActive = Boolean(gauge?.zone_active);

  const pushHitStamp = useCallback((score, position, targetCycle) => {
    const tier = getTier(score);
    const id = `${targetCycle}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const rotation = Math.round((Math.random() * 7) - 3.5);
    setHitStamps((current) => [
      ...current,
      {
        id,
        position: Math.max(0, Math.min(1, position)),
        result: tier,
        timingScore: Number(score.toFixed(3)),
        rotation,
      },
    ]);
  }, []);

  const submitTiming = useCallback((score, offset, targetCycle = cycleRef.current, stampPosition = positionRef.current) => {
    if (
      !isSessionActive ||
      !isRunning ||
      submittedCycleRef.current === targetCycle ||
      submittedCycleId === targetCycle
    ) return;
    submittedCycleRef.current = targetCycle;
    hasSubmittedTimingRef.current = true;
    setSubmittedCycleId(targetCycle);
    pushHitStamp(score, stampPosition, targetCycle);
    Promise.resolve(onSubmit({
      cycle_id: targetCycle,
      timing_score: Number(score.toFixed(3)),
      timing_offset: Number(offset.toFixed(3)),
      phase: gauge?.phase,
      running_style: runningStyle,
    })).catch(() => {
      if (submittedCycleRef.current === targetCycle) {
        submittedCycleRef.current = null;
        setSubmittedCycleId(null);
      }
    });
  }, [gauge?.phase, isRunning, isSessionActive, onSubmit, pushHitStamp, runningStyle, submittedCycleId]);

  useEffect(() => {
    const timerId = window.setTimeout(
      () => setIsSessionActive(active),
      active ? 0 : ACTIVE_RESET_GRACE_MS
    );
    return () => window.clearTimeout(timerId);
  }, [active]);

  useEffect(() => {
    const timerIds = [];
    const schedule = (callback, delay) => {
      timerIds.push(window.setTimeout(callback, delay));
    };
    const resetGauge = () => {
      setCountdownIndex(0);
      setIsRunning(false);
      setDirection(1);
      setCycleId(1);
      setSubmittedCycleId(null);
      lastFrameRef.current = 0;
      positionRef.current = 0;
      if (markerRef.current) markerRef.current.style.transform = "translate3d(0, 0, 0) translateX(-50%)";
      directionRef.current = 1;
      cycleRef.current = 1;
      submittedCycleRef.current = null;
      hasSubmittedTimingRef.current = false;
    };

    schedule(resetGauge, 0);
    if (isSessionActive) {
      countdownSteps.slice(1).forEach((_, index) => {
        schedule(() => setCountdownIndex(index + 1), (index + 1) * countdownStepMs);
      });
      schedule(
        () => setIsRunning(true),
        (countdownSteps.length - 1) * countdownStepMs + goHoldMs + timingStartDelayMs
      );
    }

    return () => timerIds.forEach((timerId) => window.clearTimeout(timerId));
  }, [countdownStepMs, countdownSteps, goHoldMs, isSessionActive, timingStartDelayMs]);

  useEffect(() => {
    if (!isSessionActive || !isRunning) return undefined;

    const updateTrackWidth = () => {
      trackWidthRef.current = trackRef.current?.clientWidth || 0;
    };
    const animate = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const elapsed = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      let nextPosition = positionRef.current + (directionRef.current * elapsed) / halfCycleMs;

      if (nextPosition >= 1 || nextPosition <= 0) {
        nextPosition = nextPosition >= 1 ? 1 : 0;
        directionRef.current *= -1;
        setDirection(directionRef.current);
        if (hasSubmittedTimingRef.current) {
          cycleRef.current += 1;
          submittedCycleRef.current = null;
          setCycleId(cycleRef.current);
          setSubmittedCycleId(null);
        }
      }

      positionRef.current = nextPosition;
      if (markerRef.current) {
        markerRef.current.style.transform = `translate3d(${nextPosition * trackWidthRef.current}px, 0, 0) translateX(-50%)`;
      }
      animationRef.current = window.requestAnimationFrame(animate);
    };

    updateTrackWidth();
    window.addEventListener("resize", updateTrackWidth);
    lastFrameRef.current = 0;
    animationRef.current = window.requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", updateTrackWidth);
      window.cancelAnimationFrame(animationRef.current);
    };
  }, [halfCycleMs, isRunning, isSessionActive]);

  const hit = useCallback(() => {
    if (
      !isSessionActive ||
      !isRunning ||
      submittedCycleRef.current === cycleRef.current ||
      submittedCycleId === cycleId
    ) return;
    const offset = (positionRef.current - 0.5) * 2;
    submitTiming(Math.max(0, 1 - Math.abs(offset)), offset, cycleRef.current, positionRef.current);
  }, [cycleId, isRunning, isSessionActive, submitTiming, submittedCycleId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat || isTypingTarget(event.target)) return;
      if (event.code !== "Space" && event.key !== "Enter") return;
      event.preventDefault();
      hit();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hit]);

  if (!isSessionActive) return null;

  return (
    <section
      className={`timing-race-gauge tempo-${tempoLevel.toLowerCase()} ${zoneActive ? "is-zone-active" : ""}`}
      style={{ "--timing-countdown-step-ms": `${countdownStepMs}ms` }}
      onPointerDown={hit}
      role="button"
      tabIndex={0}
      aria-label="Timing gauge. Press Space, Enter, click, or tap near the center."
    >
      <div className="timing-hit-stamps" aria-hidden="true">
        {hitStamps.map((stamp) => (
          <div
            key={stamp.id}
            className={`timing-hit-stamp is-${stamp.result.toLowerCase()}`}
            style={{
              left: `${stamp.position * 100}%`,
              "--stamp-rot": `${stamp.rotation}deg`,
            }}
            onAnimationEnd={() => {
              setHitStamps((current) => current.filter((item) => item.id !== stamp.id));
            }}
          >
            <span>{stamp.result}</span>
          </div>
        ))}
      </div>
      {!isRunning ? (
        <div key={countdownIndex} className="timing-countdown">{countdownSteps[countdownIndex]}</div>
      ) : (
        <>
          <div className="timing-gauge-head">
            <span>Phase {gauge?.phase || "-"} | Tempo {tempoLevel} {gauge?.tempo_label || ""} | Cycle {cycleId}</span>
            <em>{zoneActive ? `${gauge?.zone_name || "Zone"} ${gauge?.zone_remaining_seconds ?? 0}s` : `${runningStyle} | ${gauge?.track_segment || "Track"}`}</em>
          </div>
          <div ref={trackRef} className="timing-gauge-track">
            <div className="timing-gauge-speed-lines" />
            {/* <div className="timing-gauge-sweet-spot" /> */}
            <div ref={markerRef} className="timing-gauge-marker" />
          </div>
          <div className="timing-gauge-foot">
            <span>{submittedCycleId === cycleId ? "Locked until edge" : "SPACE / ENTER / CLICK / TAP"}</span>
            <em>Speed {gauge?.current_speed ?? "-"} | Accel +{gauge?.acceleration ?? 0} | Gain +{gauge?.last_distance_gain ?? 0}m | {direction > 0 ? ">" : "<"}</em>
          </div>
        </>
      )}
    </section>
  );
}
