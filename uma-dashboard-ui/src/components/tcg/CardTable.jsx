import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, RotateCcw, RotateCw, UserRound } from "lucide-react";
import CardZone from "./CardZone";
import PlayableCard from "./PlayableCard";
import ZoneViewerModal from "./ZoneViewerModal";
import CardBack from "./CardBack";
import { createCarrotCard } from "../../data/tcgMockCards";

const ZONES = ["deck", "hand", "field", "life", "discard", "carrot", "expel"];
const LEFT_ZONES = ["deck", "life", "discard", "expel"];

function drawCards(player, count) {
  const drawn = player.zones.deck.slice(0, count);
  return {
    ...player,
    zones: {
      ...player.zones,
      deck: player.zones.deck.slice(count),
      hand: [...player.zones.hand, ...drawn],
    },
  };
}

function updateCardInPlayers(players, cardId, updater) {
  const nextPlayers = {};

  Object.entries(players).forEach(([playerId, player]) => {
    const nextZones = {};

    ZONES.forEach((zone) => {
      nextZones[zone] = player.zones[zone].map((card) =>
        card.instanceId === cardId ? updater(card) : card
      );
    });

    nextPlayers[playerId] = {
      ...player,
      zones: nextZones,
    };
  });

  return nextPlayers;
}

export default function CardTable({
  players,
  setPlayers,
  onResetToDeckSelect,
}) {
  const [perspective, setPerspective] = useState("player1");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedCardHidden, setSelectedCardHidden] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [zoneViewer, setZoneViewer] = useState(null);
  const dragRef = useRef(null);

  const findCardById = useCallback(
    (cardId) => {
      if (!cardId) return null;
      for (const player of Object.values(players)) {
        for (const zone of ZONES) {
          const found = player.zones[zone].find(
            (card) => card.instanceId === cardId
          );
          if (found) return found;
        }
      }
      return null;
    },
    [players]
  );

  const selectedCard = useMemo(
    () => findCardById(selectedCardId),
    [findCardById, selectedCardId]
  );

  const hoveredCardData = useMemo(
    () => findCardById(hoveredCard?.cardId),
    [findCardById, hoveredCard?.cardId]
  );

  const previewCard = hoveredCardData || selectedCard;
  const previewHidden = hoveredCardData
    ? hoveredCard.hidden
    : selectedCardHidden;

  const activeTargetCardId = hoveredCard?.cardId || selectedCardId;

  const selectCard = useCallback((cardId, hidden = false) => {
    setSelectedCardId(cardId);
    setSelectedCardHidden(hidden);
  }, []);

  const handleCardHover = useCallback((payload) => {
    setHoveredCard({
      cardId: payload.card.instanceId,
      hidden: payload.hidden,
    });
  }, []);

  const handleCardHoverEnd = useCallback((cardId) => {
    setHoveredCard((prev) => (prev?.cardId === cardId ? null : prev));
  }, []);

  const moveCard = useCallback(
    ({ cardId, fromPlayerId, fromZone, toPlayerId, toZone, clientX, clientY }) => {
      if (!toPlayerId || !toZone) return;

      setPlayers((prev) => {
        const movingCard = prev[fromPlayerId].zones[fromZone].find(
          (card) => card.instanceId === cardId
        );
        if (!movingCard) return prev;

        const next = structuredClone(prev);
        let nextMovingCard = movingCard;

        if (toZone === "field" && clientX != null && clientY != null) {
          const zoneElement = document.querySelector(
            `[data-zone-id="${toPlayerId}:field"] .tcg-zone-body`
          );
          const rect = zoneElement?.getBoundingClientRect();
          if (rect) {
            nextMovingCard = {
              ...movingCard,
              fieldX: Math.max(8, clientX - rect.left - 58),
              fieldY: Math.max(8, clientY - rect.top - 80),
            };
          }
        } else {
          nextMovingCard = {
            ...movingCard,
            fieldX: undefined,
            fieldY: undefined,
          };
        }

        if (fromPlayerId === toPlayerId && fromZone === toZone) {
          next[toPlayerId].zones[toZone] = next[toPlayerId].zones[toZone].map(
            (card) => (card.instanceId === cardId ? nextMovingCard : card)
          );
          return next;
        }

        next[fromPlayerId].zones[fromZone] = next[fromPlayerId].zones[
          fromZone
        ].filter((card) => card.instanceId !== cardId);

        if (toZone === "deck" || toZone === "life") {
          next[toPlayerId].zones[toZone] = [
            nextMovingCard,
            ...next[toPlayerId].zones[toZone],
          ];
        } else {
          next[toPlayerId].zones[toZone] = [
            ...next[toPlayerId].zones[toZone],
            nextMovingCard,
          ];
        }

        return next;
      });
    },
    [setPlayers]
  );

  const toggleSelectedCard = useCallback(() => {
    if (!activeTargetCardId) return;

    setPlayers((prev) =>
      updateCardInPlayers(prev, activeTargetCardId, (card) => ({
        ...card,
        status: card.status === "rest" ? "active" : "rest",
      }))
    );
  }, [activeTargetCardId, setPlayers]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== "Space") return;
      if (
        event.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(event.target.tagName)
      ) {
        return;
      }

      event.preventDefault();
      toggleSelectedCard();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSelectedCard]);

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event) => {
      const current = dragRef.current;
      if (!current) return;

      const distance = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY
      );

      dragRef.current = {
        ...current,
        x: event.clientX,
        y: event.clientY,
        hasMoved: current.hasMoved || distance > 6,
      };

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              x: event.clientX,
              y: event.clientY,
              hasMoved: prev.hasMoved || distance > 6,
            }
          : prev
      );
    };

    const handlePointerUp = (event) => {
      const current = dragRef.current;
      if (!current) return;

      const targetZone = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-zone-id]")
        ?.getAttribute("data-zone-id");

      if (current.hasMoved && targetZone) {
        const [toPlayerId, toZone] = targetZone.split(":");
        moveCard({
          cardId: current.card.instanceId,
          fromPlayerId: current.playerId,
          fromZone: current.zone,
          toPlayerId,
          toZone,
          clientX: event.clientX,
          clientY: event.clientY,
        });
      } else {
        selectCard(current.card.instanceId, current.hidden);
      }

      dragRef.current = null;
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragState, moveCard, selectCard]);

  const handleCardPointerDown = (event, payload) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;

    event.preventDefault();
    const nextDrag = {
      ...payload,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      hasMoved: false,
    };

    dragRef.current = nextDrag;
    setDragState(nextDrag);
  };

  const handleDraw = (playerId, count) => {
    setPlayers((prev) => ({
      ...prev,
      [playerId]: drawCards(prev[playerId], count),
    }));
  };

  const handleAddCarrot = (playerId) => {
    setPlayers((prev) => {
      const nextCounter = (prev[playerId].carrotCounter || 0) + 1;
      return {
        ...prev,
        [playerId]: {
          ...prev[playerId],
          carrotCounter: nextCounter,
          zones: {
            ...prev[playerId].zones,
            carrot: [
              ...prev[playerId].zones.carrot,
              createCarrotCard(playerId, nextCounter),
            ],
          },
        },
      };
    });
  };

  const openZoneViewer = (playerId, zone) => {
    setZoneViewer({
      playerId,
      zone,
      playerName: players[playerId].name,
      cards: players[playerId].zones[zone],
    });
  };

  const visibleSelectedName =
    previewHidden && previewCard ? "Hidden card" : previewCard?.name || "None";

  const playerRows = [
    { id: "player2", orientation: "opponent" },
    { id: "player1", orientation: "local" },
  ];

  return (
    <div className="tcg-table-page">
      <header className="tcg-page-header">
        <div>
          <span>Two Player Sandbox</span>
          <h2>TCG Playtest Board</h2>
        </div>
        <div className="tcg-table-actions">
          <div className="tcg-perspective-toggle" aria-label="Perspective">
            {["player1", "player2"].map((playerId, index) => (
              <button
                type="button"
                key={playerId}
                className={perspective === playerId ? "active" : ""}
                onClick={() => setPerspective(playerId)}
              >
                <UserRound size={15} />
                P{index + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="tcg-secondary-action"
            onClick={onResetToDeckSelect}
          >
            <RotateCcw size={16} />
            Deck Select
          </button>
        </div>
      </header>

      <div className="tcg-rules-strip">
        <span>Hover then press Space to Tap</span>
        <span>Carrot: resource sandbox</span>
        <span>Battle: manual sandbox</span>
        <span>Keyword: future logic</span>
        <span>Preview: {visibleSelectedName}</span>
      </div>

      <div className="tcg-board">
        <div className="tcg-board-lanes">
          {playerRows.map(({ id, orientation }) => {
            const player = players[id];

            return (
              <section
                className={`tcg-player-area ${orientation}`}
                key={id}
                aria-label={player.name}
              >
              <div className="tcg-player-sidebar">
                <div className="tcg-player-name">
                  <span>{player.name}</span>
                  <strong>{player.deckName}</strong>
                </div>
                <div className="tcg-draw-buttons">
                  <button type="button" onClick={() => handleDraw(id, 1)}>
                    Draw 1
                  </button>
                  <button type="button" onClick={() => handleDraw(id, 2)}>
                    Draw 2
                  </button>
                  <button type="button" onClick={() => handleAddCarrot(id)}>
                    <Plus size={16} />
                    Add Carrot
                  </button>
                  <button type="button" onClick={toggleSelectedCard}>
                    <RotateCw size={16} />
                    Tap / Active
                  </button>
                </div>
                <div className="tcg-zone-view-buttons">
                  {ZONES.map((zone) => (
                    <button
                      type="button"
                      key={zone}
                      onClick={() => openZoneViewer(id, zone)}
                    >
                      <Eye size={13} />
                      <span>{zone}</span>
                      <strong>{player.zones[zone].length}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tcg-player-zones">
                <div className="tcg-side-zones">
                  {LEFT_ZONES.map((zone) => (
                    <CardZone
                      key={zone}
                      playerId={id}
                      zone={zone}
                      cards={player.zones[zone]}
                      perspective={perspective}
                      selectedCardId={selectedCardId}
                      hoveredCardId={hoveredCard?.cardId}
                      draggingCardId={dragState?.card.instanceId}
                      onCardHover={handleCardHover}
                      onCardHoverEnd={handleCardHoverEnd}
                      onCardPointerDown={handleCardPointerDown}
                    />
                  ))}
                </div>
                <div className="tcg-center-zones">
                  <CardZone
                    playerId={id}
                    zone="field"
                    cards={player.zones.field}
                    perspective={perspective}
                    selectedCardId={selectedCardId}
                    hoveredCardId={hoveredCard?.cardId}
                    draggingCardId={dragState?.card.instanceId}
                    onCardHover={handleCardHover}
                    onCardHoverEnd={handleCardHoverEnd}
                    onCardPointerDown={handleCardPointerDown}
                  />
                  <CardZone
                    playerId={id}
                    zone="carrot"
                    cards={player.zones.carrot}
                    perspective={perspective}
                    selectedCardId={selectedCardId}
                    hoveredCardId={hoveredCard?.cardId}
                    draggingCardId={dragState?.card.instanceId}
                    onCardHover={handleCardHover}
                    onCardHoverEnd={handleCardHoverEnd}
                    onCardPointerDown={handleCardPointerDown}
                  />
                </div>
                <CardZone
                  playerId={id}
                  zone="hand"
                  cards={player.zones.hand}
                  perspective={perspective}
                  selectedCardId={selectedCardId}
                  hoveredCardId={hoveredCard?.cardId}
                  draggingCardId={dragState?.card.instanceId}
                  onCardHover={handleCardHover}
                  onCardHoverEnd={handleCardHoverEnd}
                  onCardPointerDown={handleCardPointerDown}
                />
              </div>
              </section>
            );
          })}
        </div>
        <CardPreviewPanel
          card={previewCard}
          hidden={previewHidden}
        />
      </div>

      {dragState && (
        <div
          className="tcg-drag-overlay"
          style={{
            transform: `translate(${dragState.x + 12}px, ${
              dragState.y + 12
            }px)`,
          }}
          aria-hidden="true"
        >
          <PlayableCard
            card={dragState.card}
            compact={dragState.zone !== "field"}
            hidden={dragState.hidden}
          />
        </div>
      )}
      <ZoneViewerModal
        viewer={zoneViewer}
        perspective={perspective}
        selectedCardId={selectedCardId}
        onSelectCard={selectCard}
        onHoverCard={handleCardHover}
        onHoverCardEnd={handleCardHoverEnd}
        onClose={() => setZoneViewer(null)}
      />
    </div>
  );
}

function CardPreviewPanel({ card, hidden }) {
  return (
    <aside className="tcg-card-preview-panel" aria-label="Card preview">
      <div className="tcg-card-preview-heading">
        <span>Card Preview</span>
        <strong>{card && !hidden ? card.name : "Preview"}</strong>
      </div>
      <div className="tcg-card-preview-frame">
        {card ? (
          hidden ? (
            <CardBack />
          ) : (
            <PlayableCard card={card} />
          )
        ) : (
          <div className="tcg-card-preview-empty">
            <CardBack compact />
            <span>Select a card to preview</span>
          </div>
        )}
      </div>
      <div className="tcg-card-preview-copy">
        {card && !hidden
          ? `${card.type} / ${card.style} / ${card.power || "-"}`
          : "Hover or click a card to show a larger preview"}
      </div>
    </aside>
  );
}
