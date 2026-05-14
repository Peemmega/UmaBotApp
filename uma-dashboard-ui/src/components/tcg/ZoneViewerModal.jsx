import { X } from "lucide-react";
import PlayableCard from "./PlayableCard";

const ZONE_LABELS = {
  deck: "Deck",
  hand: "Hand",
  field: "Field",
  life: "Life Zone",
  discard: "Discard",
  carrot: "Carrot Zone",
  expel: "Expel",
};

function shouldHideCards(zone, playerId, perspective) {
  if (zone === "discard" || zone === "field" || zone === "expel") return false;
  if (zone === "hand" || zone === "life") return perspective !== playerId;
  if (zone === "deck") return perspective !== playerId;
  return false;
}

export default function ZoneViewerModal({
  viewer,
  perspective,
  selectedCardId,
  onSelectCard,
  onHoverCard,
  onHoverCardEnd,
  onClose,
}) {
  if (!viewer) return null;

  const hidden = shouldHideCards(viewer.zone, viewer.playerId, perspective);
  const title = `${viewer.playerName} - ${ZONE_LABELS[viewer.zone] || viewer.zone}`;

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
              {viewer.zone === "deck" && !hidden ? " - debug deck list" : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close zone viewer">
            <X size={20} />
          </button>
        </header>

        {viewer.cards.length === 0 ? (
          <div className="tcg-zone-modal-empty">No cards</div>
        ) : (
          <div className="tcg-zone-modal-grid">
            {viewer.cards.map((card) => (
              <PlayableCard
                key={card.instanceId}
                card={card}
                hidden={hidden}
                selected={selectedCardId === card.instanceId}
                onPointerEnter={() =>
                  onHoverCard?.({
                    card,
                    playerId: viewer.playerId,
                    zone: viewer.zone,
                    hidden,
                  })
                }
                onPointerLeave={() => onHoverCardEnd?.(card.instanceId)}
                onPointerDown={() => {
                  onSelectCard(card.instanceId, hidden);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
