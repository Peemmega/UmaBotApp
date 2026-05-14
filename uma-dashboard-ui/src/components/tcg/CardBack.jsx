export default function CardBack({ compact = false, label = "UMA" }) {
  return (
    <div className={`tcg-card-back ${compact ? "compact" : ""}`}>
      <div className="tcg-card-back-mark">{label}</div>
      <div className="tcg-card-back-ring" />
    </div>
  );
}
