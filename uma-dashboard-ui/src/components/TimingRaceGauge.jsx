import { useCallback, useEffect, useRef, useState } from "react";

const COUNTDOWN_STEPS = ["3", "2", "1", "GO!"];

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
  runningStyle,
  onSubmit,
}) {
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [cycleId, setCycleId] = useState(1);
  const [submittedCycleId, setSubmittedCycleId] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const animationRef = useRef(0);
  const lastFrameRef = useRef(0);
  const positionRef = useRef(0);
  const directionRef = useRef(1);
  const cycleRef = useRef(1);
  const submittedCycleRef = useRef(null);
  const halfCycleMs = Math.max(520, Number(gauge?.half_cycle_ms) || 1450);

  const submitTiming = useCallback((score, offset, targetCycle = cycleRef.current) => {
    if (!active || !isRunning || submittedCycleRef.current === targetCycle) return;
    submittedCycleRef.current = targetCycle;
    setSubmittedCycleId(targetCycle);
    setLastResult({ tier: getTier(score), score, cycleId: targetCycle });
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
  }, [active, gauge?.phase, isRunning, onSubmit, runningStyle]);

  useEffect(() => {
    if (!active) {
      const resetId = window.setTimeout(() => {
        setCountdownIndex(0);
        setIsRunning(false);
        setMarkerPosition(0);
        setDirection(1);
        setCycleId(1);
        setSubmittedCycleId(null);
        setLastResult(null);
        positionRef.current = 0;
        directionRef.current = 1;
        cycleRef.current = 1;
        submittedCycleRef.current = null;
      }, 0);
      return () => window.clearTimeout(resetId);
    }

    const intervalId = window.setInterval(() => {
      setCountdownIndex((current) => {
        if (current >= COUNTDOWN_STEPS.length - 1) {
          window.clearInterval(intervalId);
          window.setTimeout(() => setIsRunning(true), 520);
          return current;
        }
        return current + 1;
      });
    }, 780);

    return () => window.clearInterval(intervalId);
  }, [active]);

  useEffect(() => {
    if (!active || !isRunning) return undefined;

    const animate = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const elapsed = timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      let nextPosition = positionRef.current + (directionRef.current * elapsed) / halfCycleMs;

      if (nextPosition >= 1 || nextPosition <= 0) {
        nextPosition = nextPosition >= 1 ? 1 : 0;
        const completedCycle = cycleRef.current;
        if (submittedCycleRef.current !== completedCycle) {
          submitTiming(0, nextPosition === 1 ? 1 : -1, completedCycle);
        }
        directionRef.current *= -1;
        cycleRef.current += 1;
        submittedCycleRef.current = null;
        setDirection(directionRef.current);
        setCycleId(cycleRef.current);
        setSubmittedCycleId(null);
      }

      positionRef.current = nextPosition;
      setMarkerPosition(nextPosition);
      animationRef.current = window.requestAnimationFrame(animate);
    };

    lastFrameRef.current = 0;
    animationRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationRef.current);
  }, [active, halfCycleMs, isRunning, submitTiming]);

  const hit = useCallback(() => {
    if (!active || !isRunning || submittedCycleRef.current === cycleRef.current) return;
    const offset = (positionRef.current - 0.5) * 2;
    submitTiming(Math.max(0, 1 - Math.abs(offset)), offset);
  }, [active, isRunning, submitTiming]);

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

  if (!active) return null;

  return (
    <section
      className={`timing-race-gauge ${lastResult?.tier === "Perfect" ? "is-perfect" : ""}`}
      onPointerDown={hit}
      role="button"
      tabIndex={0}
      aria-label="Timing gauge. Press Space, Enter, click, or tap near the center."
    >
      {!isRunning ? (
        <div className="timing-countdown">{COUNTDOWN_STEPS[countdownIndex]}</div>
      ) : (
        <>
          <div className="timing-gauge-head">
            <span>{gauge?.phase || "Race"} | Cycle {cycleId}</span>
            <em>{runningStyle} | {gauge?.track_segment || "Track"}</em>
          </div>
          <div className="timing-gauge-track">
            <div className="timing-gauge-speed-lines" />
            <div className="timing-gauge-sweet-spot" />
            <div className="timing-gauge-marker" style={{ left: `${markerPosition * 100}%` }} />
          </div>
          <div className="timing-gauge-foot">
            <span>{submittedCycleId === cycleId ? "Locked until edge" : "SPACE / ENTER / CLICK / TAP"}</span>
            <em>Speed {gauge?.current_speed ?? "-"} | Accel +{gauge?.acceleration ?? 0} | {direction > 0 ? ">" : "<"}</em>
          </div>
          {lastResult ? (
            <strong key={`${lastResult.cycleId}-${lastResult.tier}`} className={`timing-result is-${lastResult.tier.toLowerCase()}`}>
              {lastResult.tier}
            </strong>
          ) : null}
        </>
      )}
    </section>
  );
}
