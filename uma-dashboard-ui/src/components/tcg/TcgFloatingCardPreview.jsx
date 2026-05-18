import { createPortal } from "react-dom";
import PlayableCard from "./PlayableCard";

function getCardSummary(card) {
  return [
    card.type,
    card.style,
    card.cost != null ? `Cost ${card.cost}` : "",
    card.power ? `Power ${card.power}` : "",
  ]
    .filter(Boolean)
    .join(" / ");
}

export default function TcgFloatingCardPreview({ card }) {
  if (!card || card.hidden || card.id === "hidden-card" || !card.image) {
    return null;
  }

  const preview = (
    <aside
      className="tcg-card-preview-panel tcg-floating-card-preview open"
      aria-label="Card preview"
    >
      <div className="tcg-card-preview-heading">
        <div>
          <span>Card Preview</span>
          <strong>{card.name}</strong>
        </div>
      </div>
      <div className="tcg-card-preview-frame">
        <PlayableCard card={card} />
      </div>
      <div className="tcg-card-preview-copy">
        <strong>{getCardSummary(card)}</strong>
        {card.text && <span>{card.text}</span>}
      </div>
    </aside>
  );

  return createPortal(preview, document.body);
}
