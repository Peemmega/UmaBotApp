import "../styles/lazyLoading.css";

export default function LazyLoadingFallback({ fullScreen = false }) {
  return (
    <div
      className={`lazy-loading${fullScreen ? " lazy-loading-fullscreen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <span className="lazy-loading-spinner" aria-hidden="true" />
      <span className="lazy-loading-label">กำลังเตรียมหน้า…</span>
    </div>
  );
}
