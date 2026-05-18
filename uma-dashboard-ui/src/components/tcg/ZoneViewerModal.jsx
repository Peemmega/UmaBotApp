import { useEffect, useState } from "react";
import { X } from "lucide-react";
import PlayableCard from "./PlayableCard";

const ZONE_LABELS = {
  deck: "Deck",
  hand: "Hand",
  field: "Field",
  trainer: "Trainer",
  life: "Life Zone",
  discard: "Discard",
  carrot: "Carrot Zone",
  expel: "Expel",
};

function shouldHideCards(zone, playerId, perspective) {
  if (zone === "deck" || zone === "life") return true;
  if (zone === "discard" || zone === "field" || zone === "trainer" || zone === "expel") return false;
  if (zone === "hand" || zone === "life") return perspective !== playerId;
  return false;
}

export default function ZoneViewerModal({
  viewer,
  perspective,
  selectedCardIds = [],
  onSelectCard,
  onHoverCard,
  onHoverCardEnd,
  activePlayerId,
  onMoveCard,
  onClose,
}) {
  const [deckRevealed, setDeckRevealed] = useState(false);

  useEffect(() => {
    setDeckRevealed(false);
  }, [viewer?.playerId, viewer?.zone]);

  if (!viewer) return null;

  const canRevealDeck =
    viewer.zone === "deck" && viewer.playerId === activePlayerId;
  const baseHidden = shouldHideCards(viewer.zone, viewer.playerId, perspective);
  const hidden = baseHidden && !(canRevealDeck && deckRevealed);
  const title = `${viewer.playerName} - ${ZONE_LABELS[viewer.zone] || viewer.zone}`;
  const canMove =
    !hidden &&
    viewer.playerId === activePlayerId &&
    ["deck", "discard", "expel"].includes(viewer.zone);
  const selectedCards = new Set(selectedCardIds);

  const handleMove = (card, toZone) => {
    onMoveCard?.({
      cardId: card.instanceId,
      fromPlayerId: viewer.playerId,
      fromZone: viewer.zone,
      toPlayerId: viewer.playerId,
      toZone,
    });
  };

  return (
    <div className="tcg-zone-modal-backdrop" onPointerDown={onClose}>
      <section
        className="tcg-zone-modal"
        aria-modal="true"
        role="dialog"
        aria-label={title}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="tcg-zone-modal-header">
          <div>
            <span>{hidden ? "Hidden information" : "Playtest viewer"}</span>
            <h3>{title}</h3>
            <p>
              {viewer.cards.length} cards
              {viewer.zone === "deck" && !hidden ? " - revealed deck list" : ""}
            </p>
            {canMove && (
              <p className="tcg-zone-modal-hint">
                Move cards from this viewer to Hand, Field, Discard, or Expel.
              </p>
            )}
          </div>
          <div className="tcg-zone-modal-header-actions">
            {canRevealDeck && (
              <button
                type="button"
                className="tcg-zone-modal-reveal"
                onClick={(event) => {
                  event.currentTarget.blur();
                  setDeckRevealed((revealed) => !revealed);
                }}
              >
                {deckRevealed ? "Hide Deck" : "Show Deck"}
              </button>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.currentTarget.blur();
                onClose();
              }}
              aria-label="Close zone viewer"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {viewer.cards.length === 0 ? (
          <div className="tcg-zone-modal-empty">No cards</div>
        ) : (
          <div className="tcg-zone-modal-grid">
            {viewer.cards.map((card) => (
              <div className="tcg-zone-modal-card" key={card.instanceId}>
                <PlayableCard
                  card={card}
                  hidden={hidden}
                  selected={selectedCards.has(card.instanceId)}
                  onPointerEnter={() =>
                    onHoverCard?.({
                      card,
                      playerId: viewer.playerId,
                      zone: viewer.zone,
                      hidden,
                    })
                  }
                  onPointerLeave={() => onHoverCardEnd?.(card.instanceId)}
                  onPointerDown={(event) => {
                    if (hidden) return;
                    onSelectCard(card.instanceId, hidden, {
                      additive: event.ctrlKey || event.metaKey,
                    });
                  }}
                />
                {canMove && (
                  <div className="tcg-zone-modal-card-actions">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.blur();
                        handleMove(card, "hand");
                      }}
                    >
                      Hand
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.blur();
                        handleMove(card, "field");
                      }}
                    >
                      Field
                    </button>
                    {viewer.zone !== "discard" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.currentTarget.blur();
                          handleMove(card, "discard");
                        }}
                      >
                        Discard
                      </button>
                    )}
                    {viewer.zone !== "expel" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.currentTarget.blur();
                          handleMove(card, "expel");
                        }}
                      >
                        Expel
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
