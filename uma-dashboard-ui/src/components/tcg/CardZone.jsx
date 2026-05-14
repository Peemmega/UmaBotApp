import CardBack from "./CardBack";
import PlayableCard from "./PlayableCard";

const PILE_ZONES = new Set(["deck", "life", "discard", "carrot"]);

function getZoneTitle(zone) {
  const titles = {
    deck: "Deck",
    hand: "Hand",
    field: "Field",
    trainer: "Trainer Zone",
    life: "Life Zone",
    discard: "Discard",
    carrot: "Carrot Zone",
  };
  return titles[zone] || zone;
}

export default function CardZone({
  playerId,
  zone,
  cards,
  perspective,
  selectedCardId,
  onCardPointerDown,
  draggingCardId,
}) {
  const zoneId = `${playerId}:${zone}`;
  const isPile = PILE_ZONES.has(zone);
  const isOpponentHand = zone === "hand" && perspective !== playerId;
  const isHiddenPile = zone === "deck" || zone === "life";
  const visibleCards = isPile ? cards.slice(0, 1) : cards;

  return (
    <section className={`tcg-zone tcg-zone-${zone}`} data-zone-id={zoneId}>
      <header className="tcg-zone-header">
        <span>{getZoneTitle(zone)}</span>
        <strong>{cards.length}</strong>
      </header>

      <div className={`tcg-zone-body ${isPile ? "pile" : "spread"}`}>
        {cards.length === 0 ? (
          <div className="tcg-empty-zone">Drop</div>
        ) : (
          visibleCards.map((card) => (
            <PlayableCard
              key={card.instanceId}
              card={card}
              compact={zone !== "field" && zone !== "trainer"}
              hidden={isOpponentHand || isHiddenPile}
              selected={selectedCardId === card.instanceId}
              isDragging={draggingCardId === card.instanceId}
              onPointerDown={(event) =>
                onCardPointerDown(event, {
                  card,
                  playerId,
                  zone,
                  hidden: isOpponentHand || isHiddenPile,
                })
              }
            />
          ))
        )}
        {isPile && cards.length > 1 && (
          <div className="tcg-pile-depth" aria-hidden="true">
            <CardBack compact />
          </div>
        )}
      </div>
    </section>
  );
}
