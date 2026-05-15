import { Check } from "lucide-react";
import { tcgStyleThemes } from "../../data/tcgRuntime";

export default function DeckPreviewCard({ deck, selected, onSelect }) {
  const theme = tcgStyleThemes[deck.style] || tcgStyleThemes.Speed;
  const validation = deck.validation || { valid: true, errors: [] };

  return (
    <button
      type="button"
      className={`tcg-deck-preview ${selected ? "selected" : ""}`}
      style={{
        "--deck-style-color": theme.color,
        "--deck-style-accent": theme.accent,
      }}
      onClick={() => onSelect(deck.id)}
    >
      <span className="tcg-deck-selected-icon" aria-hidden="true">
        <Check size={17} strokeWidth={3} />
      </span>
      <div className="tcg-deck-preview-art">{deck.style}</div>
      <div className="tcg-deck-preview-main">
        <div className="tcg-deck-preview-title-row">
          <h3>{deck.name}</h3>
          <span>{deck.style}</span>
        </div>
        <p>{deck.description}</p>
        <div className="tcg-deck-highlight">{deck.highlight}</div>
        <div className="tcg-deck-tags">
          {deck.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="tcg-deck-meta">
          <span>Main Deck {deck.mainDeckCount || deck.cards.length}</span>
          <span>Trainer {deck.trainerCard ? "1" : "0"}</span>
          <span>{deck.keyCards.join(" / ")}</span>
        </div>
        {!validation.valid && (
          <div className="tcg-deck-highlight">
            Invalid: {validation.errors.join(" / ")}
          </div>
        )}
      </div>
    </button>
  );
}
