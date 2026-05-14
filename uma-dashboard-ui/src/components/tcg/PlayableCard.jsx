import { tcgStyleThemes } from "../../data/tcgMockCards";
import CardBack from "./CardBack";

export default function PlayableCard({
  card,
  hidden = false,
  compact = false,
  selected = false,
  onPointerDown,
  isDragging = false,
}) {
  if (!card) return null;

  const theme = tcgStyleThemes[card.style] || tcgStyleThemes.Speed;

  return (
    <button
      type="button"
      className={[
        "tcg-playable-card",
        compact ? "compact" : "",
        selected ? "selected" : "",
        card.status === "rest" ? "rested" : "",
        isDragging ? "dragging-source" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--card-style-color": theme.color,
        "--card-style-accent": theme.accent,
      }}
      onPointerDown={(event) => onPointerDown?.(event, card)}
      aria-label={hidden ? "Hidden card" : card.name}
    >
      {hidden ? (
        <CardBack compact={compact} />
      ) : (
        <>
          <div className="tcg-card-topline">
            <span>{card.type}</span>
            <strong>{card.cost}</strong>
          </div>
          <div className="tcg-card-art">
            <span>{card.style}</span>
          </div>
          <div className="tcg-card-name">{card.name}</div>
          <div className="tcg-card-stats">
            <span>{card.style}</span>
            <strong>{card.power || "-"}</strong>
          </div>
          {!compact && <p className="tcg-card-text">{card.text}</p>}
        </>
      )}
    </button>
  );
}
