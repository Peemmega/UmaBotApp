import { useEffect, useState } from "react";
import "../styles/lazyLoading.css";

export default function LazyLoadingFallback({ fullScreen = false, onFinished }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!onFinished) return undefined;

    const fadeTimer = window.setTimeout(() => setIsExiting(true), 2000);
    const finishTimer = window.setTimeout(onFinished, 2650);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinished]);

  return (
    <div
      className={`lazy-loading${fullScreen ? " lazy-loading-fullscreen" : ""}${isExiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลดข้อมูล"
    >
      <span className="lazy-loading-spinner" aria-hidden="true" />
      <span className="lazy-loading-label">กำลังเตรียมหน้า…</span>
    </div>
  );
}
