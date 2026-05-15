import { useState } from "react";
import { tcgStyleThemes } from "../../data/tcgRuntime";
import CardBack from "./CardBack";

export default function PlayableCard({
  card,
  hidden = false,
  compact = false,
  selected = false,
  hovered = false,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  isDragging = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  if (!card) return null;

  const theme = tcgStyleThemes[card.style] || tcgStyleThemes.Speed;
  const hasImage = card.image && !imageFailed;

  return (
    <button
      type="button"
      className={[
        "tcg-playable-card",
        compact ? "compact" : "",
        selected ? "selected" : "",
        hovered ? "hovered" : "",
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
      onPointerEnter={() => onPointerEnter?.(card)}
      onPointerLeave={() => onPointerLeave?.(card)}
      aria-label={hidden ? "Hidden card" : card.name}
    >
      {hidden ? (
        <CardBack compact={compact} />
      ) : hasImage ? (
        <div className="tcg-card-image-wrap">
          <img
            className="tcg-card-image"
            src={card.image}
            alt={card.name}
            draggable="false"
            onError={() => setImageFailed(true)}
          />
          <div className="tcg-card-image-meta">
            <span>{card.type}</span>
            {/* <strong>{card.cost}</strong> */}
          </div>
        </div>
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
