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
  cycleId,
  gauge,
  runningStyle,
  onSubmit,
}) {
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [position, setPosition] = useState(0);
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState(null);
  const animationRef = useRef(0);
  const startRef = useRef(0);
  const cycleRef = useRef(cycleId);
  const submitRef = useRef(false);
  const halfCycleMs = Math.max(520, Number(gauge?.half_cycle_ms) || 1450);
  const reverse = Number(cycleId) % 2 === 0;

  useEffect(() => {
    if (!active) {
      const resetId = window.setTimeout(() => {
        setCountdownIndex(0);
        setReady(false);
      }, 0);
      return () => window.clearTimeout(resetId);
    }

    const intervalId = window.setInterval(() => {
      setCountdownIndex((current) => {
        if (current >= COUNTDOWN_STEPS.length - 1) {
          window.clearInterval(intervalId);
          window.setTimeout(() => setReady(true), 520);
          return current;
        }
        return current + 1;
      });
    }, 780);

    return () => window.clearInterval(intervalId);
  }, [active]);

  useEffect(() => {
    cycleRef.current = cycleId;
    submitRef.current = false;
    startRef.current = 0;
    const resetId = window.setTimeout(() => {
      setLocked(false);
      setResult(null);
      setPosition(0);
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [cycleId]);

  const submit = useCallback((score, offset) => {
    if (!active || !ready || submitRef.current) return;
    submitRef.current = true;
    setLocked(true);
    const tier = getTier(score);
    setResult({ tier, score });
    Promise.resolve(onSubmit({
      cycle_id: cycleRef.current,
      timing_score: Number(score.toFixed(3)),
      timing_offset: Number(offset.toFixed(3)),
      phase: gauge?.phase,
      running_style: runningStyle,
    })).catch(() => {
      submitRef.current = false;
      setLocked(false);
    });
  }, [active, gauge?.phase, onSubmit, ready, runningStyle]);

  useEffect(() => {
    if (!active || !ready) return undefined;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min(1, (timestamp - startRef.current) / halfCycleMs);
      setPosition(reverse ? 1 - progress : progress);

      if (progress >= 1) {
        if (!submitRef.current) submit(0, reverse ? -1 : 1);
        return;
      }
      animationRef.current = window.requestAnimationFrame(animate);
    };

    animationRef.current = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationRef.current);
  }, [active, halfCycleMs, ready, reverse, submit]);

  const hit = useCallback(() => {
    if (!active || !ready || locked || submitRef.current) return;
    const offset = (position - 0.5) * 2;
    submit(Math.max(0, 1 - Math.abs(offset)), offset);
  }, [active, locked, position, ready, submit]);

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
      className={`timing-race-gauge ${result?.tier === "Perfect" ? "is-perfect" : ""}`}
      onPointerDown={hit}
      role="button"
      tabIndex={0}
      aria-label="Timing gauge. Press Space, Enter, click, or tap near the center."
    >
      {!ready ? (
        <div className="timing-countdown">{COUNTDOWN_STEPS[countdownIndex]}</div>
      ) : (
        <>
          <div className="timing-gauge-head">
            <span>{gauge?.phase || "Race"} · Cycle {cycleId}</span>
            <em>{runningStyle} · {gauge?.track_segment || "Track"}</em>
          </div>
          <div className="timing-gauge-track">
            <div className="timing-gauge-speed-lines" />
            <div className="timing-gauge-sweet-spot" />
            <div className="timing-gauge-marker" style={{ left: `${position * 100}%` }} />
          </div>
          <div className="timing-gauge-foot">
            <span>{locked ? "Locked until next cycle" : "SPACE / ENTER / CLICK / TAP"}</span>
            <em>Speed {gauge?.current_speed ?? "-"} · Accel +{gauge?.acceleration ?? 0}</em>
          </div>
          {result ? (
            <strong className={`timing-result is-${result.tier.toLowerCase()}`}>
              {result.tier}
            </strong>
          ) : null}
        </>
      )}
    </section>
  );
}
