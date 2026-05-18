import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { tcgAssets, tcgStyleThemes } from "../../data/tcgRuntime";

export default function DeckPreviewCard({
  deck,
  selected,
  onSelect,
  cardsById = {},
  onPreviewCard,
  onPreviewEnd,
}) {
  const [showCards, setShowCards] = useState(false);
  const theme = tcgStyleThemes[deck.style] || tcgStyleThemes.Speed;
  const validation = deck.validation || { valid: true, errors: [] };
  const firstMainDeckCardId = Object.keys(deck.mainDeck || {})[0];
  const cardById = useMemo(() => {
    const cards = new Map();
    Object.values(cardsById || {}).forEach((card) => {
      if (card?.id && !cards.has(card.id)) cards.set(card.id, card);
    });
    [...(deck.cards || []), deck.coverCard].forEach((card) => {
      if (card?.id && !cards.has(card.id)) cards.set(card.id, card);
    });
    return cards;
  }, [cardsById, deck.cards, deck.coverCard]);
  const coverCard = cardById.get(firstMainDeckCardId) || deck.coverCard || null;
  const coverImage = coverCard?.image || tcgAssets.cardBack || "";
  const coverLabel = coverCard?.name || deck.name || deck.style;
  const totalCards = deck.mainDeckCount || deck.cards?.length || 0;
  const keyCards = (deck.keyCards || []).filter(Boolean).join(" / ");
  const deckRows = useMemo(
    () =>
      Object.entries(deck.mainDeck || {}).map(([cardId, quantity]) => ({
        cardId,
        quantity,
        card: cardById.get(cardId) || { id: cardId, name: cardId },
      })),
    [cardById, deck.mainDeck]
  );
  const showPreview = (card) => {
    if (!card?.image || card.hidden || card.id === "hidden-card") return;
    onPreviewCard?.(card);
  };
  const hidePreview = () => onPreviewEnd?.();

  const handleSelect = () => onSelect(deck.id);
  const handleOpenDeckList = (event) => {
    event.stopPropagation();
    setShowCards(true);
  };
  const handleCloseDeckList = () => {
    hidePreview();
    setShowCards(false);
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  };

  useEffect(() => {
    if (!showCards) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") handleCloseDeckList();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showCards]);

  const deckListModal = showCards ? (
    <div
      className="tcg-deck-list-backdrop"
      role="presentation"
      onClick={handleCloseDeckList}
    >
      <section
        className="tcg-deck-list-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${deck.name} card list`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="tcg-deck-list-header">
          <div>
            <span>Deck List</span>
            <h3>{deck.name}</h3>
          </div>
          <button
            type="button"
            className="tcg-deck-list-close"
            onClick={handleCloseDeckList}
            aria-label="Close deck list"
          >
            <X size={18} />
          </button>
        </header>

        <div className="tcg-deck-list-rows">
          {deckRows.map(({ cardId, quantity, card }) => (
            <div className="tcg-deck-list-row" key={cardId}>
              {card.image ? (
                <img
                  src={card.image}
                  alt=""
                  draggable="false"
                  onMouseEnter={() => showPreview(card)}
                  onMouseLeave={hidePreview}
                  onFocus={() => showPreview(card)}
                  onBlur={hidePreview}
                />
              ) : (
                <div />
              )}
              <strong>x{quantity}</strong>
              <div>
                <span>{card.name}</span>
                <small>
                  {[
                    card.type,
                    card.style,
                    card.cost != null ? `Cost ${card.cost}` : "",
                    card.power ? `Power ${card.power}` : "",
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <article
        className={`tcg-deck-preview ${selected ? "selected" : ""}`}
        style={{
          "--deck-style-color": theme.color,
          "--deck-style-accent": theme.accent,
        }}
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
      >
        <span className="tcg-deck-selected-icon" aria-hidden="true">
          <Check size={17} strokeWidth={3} />
        </span>
        <div className="tcg-deck-preview-art">
          {coverImage ? (
            <img
              src={coverImage}
              alt={coverLabel}
              loading="lazy"
              draggable="false"
              onMouseEnter={() => showPreview(coverCard)}
              onMouseLeave={hidePreview}
              onFocus={() => showPreview(coverCard)}
              onBlur={hidePreview}
            />
          ) : (
            <span>{coverLabel}</span>
          )}
        </div>
        <div className="tcg-deck-preview-main">
          <div className="tcg-deck-preview-title-row">
            <h3>{deck.name}</h3>
            <span>{deck.style}</span>
          </div>
          <p>{deck.description}</p>
          {deck.highlight && <div className="tcg-deck-highlight">{deck.highlight}</div>}
          <div className="tcg-deck-tags">
            {(deck.tags || []).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          {/* <div className="tcg-deck-meta">
            <span>Main Deck {totalCards}</span>
            {keyCards && <span>{keyCards}</span>}
          </div> */}
          <div className="tcg-deck-preview-actions">
            {/* <button
              type="button"
              className="tcg-select-deck-button"
              onClick={(event) => {
                event.stopPropagation();
                handleSelect();
              }}
            >
              Select Deck
            </button> */}
            <button
              type="button"
              className="tcg-view-deck-button"
              onClick={handleOpenDeckList}
            >
              View Cards
            </button>
          </div>
          {!validation.valid && (
            <div className="tcg-deck-highlight">
              Invalid: {validation.errors.join(" / ")}
            </div>
          )}
        </div>
      </article>

      {deckListModal ? createPortal(deckListModal, document.body) : null}
    </>
  );
}
