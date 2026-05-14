import PlayableCard from "./PlayableCard";

const PILE_ZONES = new Set(["deck", "life", "discard", "expel"]);
const ALWAYS_HIDDEN_ZONES = new Set(["deck", "life"]);
const HIDE_HEADER_ZONES = new Set(["field", "carrot"]);

function getZoneTitle(zone) {
  const titles = {
    deck: "Deck",
    hand: "Hand",
    field: "Field",
    life: "Life Zone",
    discard: "Discard",
    carrot: "Carrot Zone",
    expel: "Expel",
  };

  return titles[zone] || zone;
}

export default function CardZone({
  playerId,
  zone,
  cards,
  perspective,
  selectedCardId,
  hoveredCardId,
  onCardPointerDown,
  onCardHover,
  onCardHoverEnd,
  draggingCardId,
  canDragCards = true,
}) {
  const zoneId = `${playerId}:${zone}`;
  const isPile = PILE_ZONES.has(zone);
  const isOpponentHand = zone === "hand" && perspective !== playerId;
  const isHiddenZone = ALWAYS_HIDDEN_ZONES.has(zone);
  const isHiddenCard = isOpponentHand || isHiddenZone || cards[0]?.hidden;
  const visibleCards = isPile ? cards.slice(0, 1) : cards;
  const isFreeField = zone === "field";
  const hideHeader = HIDE_HEADER_ZONES.has(zone);

  return (
    <section className={`tcg-zone tcg-zone-${zone}`} data-zone-id={zoneId}>
      {!hideHeader && (
        <header className="tcg-zone-header">
          <span>{getZoneTitle(zone)}</span>
          <strong>{cards.length}</strong>
        </header>
      )}

      <div
        className={`tcg-zone-body ${
          isPile ? "pile" : isFreeField ? "free" : "spread"
        }`}
      >
        {cards.length === 0 ? (
          <div className="tcg-empty-zone">
            {zone === "expel" ? "Expel" : "Drop"}
          </div>
        ) : (
          visibleCards.map((card, index) => (
            <div
              key={card.instanceId}
              className={
                isFreeField ? "tcg-field-card-slot" : "tcg-zone-card-slot"
              }
              style={
                isFreeField
                  ? {
                      left: `${card.fieldX ?? 12}px`,
                      top: `${card.fieldY ?? 12}px`,
                    }
                  : { "--card-index": index }
              }
            >
              <PlayableCard
                card={card}
                compact={zone !== "field"}
                hidden={isHiddenCard}
                selected={selectedCardId === card.instanceId}
                hovered={hoveredCardId === card.instanceId}
                isDragging={draggingCardId === card.instanceId}
                onPointerEnter={() =>
                  onCardHover?.({
                    card,
                    playerId,
                    zone,
                    hidden: isHiddenCard,
                  })
                }
                onPointerLeave={() => onCardHoverEnd?.(card.instanceId)}
                onPointerDown={(event) => {
                  if (!canDragCards) return;

                  onCardPointerDown(event, {
                    card,
                    playerId,
                    zone,
                    hidden: isHiddenCard,
                  });
                }}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}