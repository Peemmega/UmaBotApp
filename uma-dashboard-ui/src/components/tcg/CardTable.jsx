import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, RotateCw, UserRound } from "lucide-react";
import CardZone from "./CardZone";
import PlayableCard from "./PlayableCard";

const ZONES = ["deck", "hand", "field", "life", "discard"];

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
  const [dragState, setDragState] = useState(null);
  const dragRef = useRef(null);

  const selectedCard = useMemo(() => {
    for (const player of Object.values(players)) {
      for (const zone of ZONES) {
        const found = player.zones[zone].find(
          (card) => card.instanceId === selectedCardId
        );
        if (found) return found;
      }
    }
    return null;
  }, [players, selectedCardId]);

  const moveCard = useCallback(
    ({ cardId, fromPlayerId, fromZone, toPlayerId, toZone }) => {
      if (!toPlayerId || !toZone) return;
      if (fromPlayerId === toPlayerId && fromZone === toZone) return;

      setPlayers((prev) => {
        const movingCard = prev[fromPlayerId].zones[fromZone].find(
          (card) => card.instanceId === cardId
        );
        if (!movingCard) return prev;

        const next = structuredClone(prev);
        next[fromPlayerId].zones[fromZone] = next[fromPlayerId].zones[
          fromZone
        ].filter((card) => card.instanceId !== cardId);

        if (toZone === "deck" || toZone === "life") {
          next[toPlayerId].zones[toZone] = [
            movingCard,
            ...next[toPlayerId].zones[toZone],
          ];
        } else {
          next[toPlayerId].zones[toZone] = [
            ...next[toPlayerId].zones[toZone],
            movingCard,
          ];
        }

        return next;
      });
    },
    [setPlayers]
  );

  const toggleSelectedCard = useCallback(() => {
    if (!selectedCardId) return;

    setPlayers((prev) =>
      updateCardInPlayers(prev, selectedCardId, (card) => ({
        ...card,
        status: card.status === "rest" ? "active" : "rest",
      }))
    );
  }, [selectedCardId, setPlayers]);

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
        });
      } else {
        setSelectedCardId(current.card.instanceId);
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
  }, [dragState, moveCard]);

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
        <span>Carrot: placeholder</span>
        <span>Battle: manual sandbox</span>
        <span>Keyword: future logic</span>
        <span>Selected: {selectedCard?.name || "None"}</span>
      </div>

      <div className="tcg-board">
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
                  <button type="button" onClick={toggleSelectedCard}>
                    <RotateCw size={16} />
                    Tap / Active
                  </button>
                </div>
              </div>

              <div className="tcg-player-zones">
                <div className="tcg-side-zones">
                  <CardZone
                    playerId={id}
                    zone="deck"
                    cards={player.zones.deck}
                    perspective={perspective}
                    selectedCardId={selectedCardId}
                    draggingCardId={dragState?.card.instanceId}
                    onCardPointerDown={handleCardPointerDown}
                  />
                  <CardZone
                    playerId={id}
                    zone="life"
                    cards={player.zones.life}
                    perspective={perspective}
                    selectedCardId={selectedCardId}
                    draggingCardId={dragState?.card.instanceId}
                    onCardPointerDown={handleCardPointerDown}
                  />
                  <CardZone
                    playerId={id}
                    zone="discard"
                    cards={player.zones.discard}
                    perspective={perspective}
                    selectedCardId={selectedCardId}
                    draggingCardId={dragState?.card.instanceId}
                    onCardPointerDown={handleCardPointerDown}
                  />
                </div>
                <CardZone
                  playerId={id}
                  zone="field"
                  cards={player.zones.field}
                  perspective={perspective}
                  selectedCardId={selectedCardId}
                  draggingCardId={dragState?.card.instanceId}
                  onCardPointerDown={handleCardPointerDown}
                />
                <CardZone
                  playerId={id}
                  zone="hand"
                  cards={player.zones.hand}
                  perspective={perspective}
                  selectedCardId={selectedCardId}
                  draggingCardId={dragState?.card.instanceId}
                  onCardPointerDown={handleCardPointerDown}
                />
              </div>
            </section>
          );
        })}
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
    </div>
  );
}
