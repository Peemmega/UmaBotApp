import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, Plus, RotateCcw, RotateCw, Shuffle, UserRound } from "lucide-react";
import CardZone from "./CardZone";
import PlayableCard from "./PlayableCard";
import ZoneViewerModal from "./ZoneViewerModal";
import CardBack from "./CardBack";
import { createCarrotCard, shuffleCards } from "../../data/tcgRuntime";

const ZONES = ["deck", "hand", "field", "life", "discard", "carrot", "expel"];
const LEFT_ZONES = ["deck", "life", "discard", "expel"];
const VIEWABLE_ZONES = ["deck", "discard", "expel"];
const UNTAP_ZONES = ["field", "carrot"];

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
  currentPlayerId = "player1",
  onlineMode = false,
  playerSlotLabel = "",
  actionHandlers = null,
}) {
  const [perspective, setPerspective] = useState("player1");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedCardHidden, setSelectedCardHidden] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [zoneViewer, setZoneViewer] = useState(null);
  const [shuffleNotice, setShuffleNotice] = useState({});
  const activePlayerId = currentPlayerId || "player1";
  const tablePerspective = onlineMode ? activePlayerId : perspective;
  const opponentPlayerId = activePlayerId === "player1" ? "player2" : "player1";
  const topPlayerId = onlineMode ? opponentPlayerId : "player2";
  const bottomPlayerId = onlineMode ? activePlayerId : "player1";
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

  const findCardLocation = useCallback(
    (cardId) => {
      if (!cardId) return null;
      for (const [playerId, player] of Object.entries(players)) {
        for (const zone of ZONES) {
          const found = player.zones[zone].find(
            (card) => card.instanceId === cardId
          );
          if (found) return { playerId, zone, card: found };
        }
      }
      return null;
    },
    [players]
  );

  const hoveredCardData = useMemo(
    () => findCardById(hoveredCard?.cardId),
    [findCardById, hoveredCard?.cardId]
  );

  const previewCard = hoveredCardData;
  const previewHidden = hoveredCard?.hidden || false;

  const activeTargetCardId = hoveredCard?.cardId || selectedCardId;
  const activeTargetLocation = useMemo(
    () => findCardLocation(activeTargetCardId),
    [activeTargetCardId, findCardLocation]
  );

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

  const moveCardBetweenZones = useCallback(
    ({
      cardId,
      fromPlayerId,
      fromZone,
      toPlayerId = fromPlayerId,
      toZone,
      clientX,
      clientY,
    }) => {
      if (!toPlayerId || !toZone) return;
      if (
        onlineMode &&
        (fromPlayerId !== activePlayerId || toPlayerId !== activePlayerId)
      ) {
        return;
      }

      if (actionHandlers?.moveCard) {
        let fieldX;
        let fieldY;
        if (toZone === "field" && clientX != null && clientY != null) {
          const zoneElement = document.querySelector(
            `[data-zone-id="${toPlayerId}:field"] .tcg-zone-body`
          );
          const rect = zoneElement?.getBoundingClientRect();
          if (rect) {
            fieldX = Math.max(8, clientX - rect.left - 58);
            fieldY = Math.max(8, clientY - rect.top - 80);
          }
        }
        actionHandlers.moveCard({
          playerId: fromPlayerId,
          cardId,
          fromZone,
          toZone,
          fieldX,
          fieldY,
        });
        return;
      }

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
    [actionHandlers, activePlayerId, onlineMode, setPlayers]
  );

  const moveCard = moveCardBetweenZones;

  const toggleSelectedCard = useCallback(() => {
    if (!activeTargetCardId) return;
    if (onlineMode && activeTargetLocation?.playerId !== activePlayerId) return;

    if (actionHandlers?.tapCard) {
      actionHandlers.tapCard(activeTargetCardId);
      return;
    }

    setPlayers((prev) =>
      updateCardInPlayers(prev, activeTargetCardId, (card) => ({
        ...card,
        status: card.status === "rest" ? "active" : "rest",
      }))
    );
  }, [
    actionHandlers,
    activePlayerId,
    activeTargetCardId,
    activeTargetLocation?.playerId,
    onlineMode,
    setPlayers,
  ]);

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
    if (onlineMode && payload.playerId !== activePlayerId) return;

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
    if (actionHandlers?.draw) {
      actionHandlers.draw(count);
      return;
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: drawCards(prev[playerId], count),
    }));
  };

  const handleShuffleDeck = (playerId) => {
    if (actionHandlers?.shuffleDeck) {
      actionHandlers.shuffleDeck();
      return;
    }

    const deckCount = players[playerId].zones.deck.length;
    if (deckCount === 0) {
      setShuffleNotice((prev) => ({ ...prev, [playerId]: "Deck empty" }));
      return;
    }

    setPlayers((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        zones: {
          ...prev[playerId].zones,
          deck: shuffleCards(prev[playerId].zones.deck),
        },
      },
    }));
    setShuffleNotice((prev) => ({
      ...prev,
      [playerId]: `Shuffled ${deckCount}`,
    }));
  };

  const handleUntapAll = (playerId) => {
    if (actionHandlers?.untapAll) {
      actionHandlers.untapAll();
      return;
    }

    setPlayers((prev) => {
      const nextZones = { ...prev[playerId].zones };

      UNTAP_ZONES.forEach((zone) => {
        nextZones[zone] = nextZones[zone].map((card) => ({
          ...card,
          status: "active",
        }));
      });

      return {
        ...prev,
        [playerId]: {
          ...prev[playerId],
          zones: nextZones,
        },
      };
    });
  };

  const handleAddCarrot = (playerId) => {
    if (actionHandlers?.addCarrot) {
      actionHandlers.addCarrot();
      return;
    }

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
    previewHidden && previewCard ? "Hidden card" : previewCard?.name || "Hover a card";
  const activePlayer = players[activePlayerId];

  return (
    <div className="tcg-table-page tcg-fullscreen-layout">
      <aside className="tcg-control-rail">
        <header className="tcg-rail-header">
          <span>Two Player Sandbox</span>
          <h2>TCG Playtest Board</h2>
          {playerSlotLabel && <p>{playerSlotLabel}</p>}
        </header>

        {!onlineMode && (
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
        )}

        {onResetToDeckSelect && (
          <button
            type="button"
            className="tcg-secondary-action tcg-rail-deck-select"
            onClick={onResetToDeckSelect}
          >
            <RotateCcw size={16} />
            Deck Select
          </button>
        )}

        <PlayerControls
          player={activePlayer}
          playerId={activePlayerId}
          notice={shuffleNotice[activePlayerId] || "Hover card / Space to Tap"}
          onDraw={handleDraw}
          onShuffle={handleShuffleDeck}
          onAddCarrot={handleAddCarrot}
          onTap={toggleSelectedCard}
          onUntapAll={handleUntapAll}
          onOpenZone={openZoneViewer}
        />

        <div className="tcg-rules-strip">
          <span>Hover then press Space to Tap</span>
          <span>Carrot: resource sandbox</span>
          <span>Battle: manual sandbox</span>
          <span>Keyword: future logic</span>
          <span>Preview: {visibleSelectedName}</span>
        </div>
      </aside>

      <main className="tcg-board-stage">
        <div className="tcg-board tcg-sim-board">
          <PlayerTableArea
            player={players[topPlayerId]}
            playerId={topPlayerId}
            side="opponent"
            perspective={tablePerspective}
            selectedCardId={selectedCardId}
            hoveredCardId={hoveredCard?.cardId}
            draggingCardId={dragState?.card.instanceId}
            onCardHover={handleCardHover}
            onCardHoverEnd={handleCardHoverEnd}
            onCardPointerDown={handleCardPointerDown}
          />

          <div className="tcg-center-divider" aria-hidden="true">
            <span>Playmat</span>
          </div>

          <PlayerTableArea
            player={players[bottomPlayerId]}
            playerId={bottomPlayerId}
            side="local"
            perspective={tablePerspective}
            selectedCardId={selectedCardId}
            hoveredCardId={hoveredCard?.cardId}
            draggingCardId={dragState?.card.instanceId}
            onCardHover={handleCardHover}
            onCardHoverEnd={handleCardHoverEnd}
            onCardPointerDown={handleCardPointerDown}
          />
        </div>
      </main>

      <CardPreviewPanel
        card={previewCard}
        hidden={previewHidden}
      />

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
        viewer={
          zoneViewer
            ? {
                ...zoneViewer,
                cards: players[zoneViewer.playerId].zones[zoneViewer.zone],
              }
            : null
        }
        perspective={tablePerspective}
        selectedCardId={selectedCardId}
        onSelectCard={selectCard}
        onHoverCard={handleCardHover}
        onHoverCardEnd={handleCardHoverEnd}
        activePlayerId={activePlayerId}
        onMoveCard={moveCardBetweenZones}
        onClose={() => setZoneViewer(null)}
      />
    </div>
  );
}

function PlayerTableArea({
  player,
  playerId,
  side,
  perspective,
  selectedCardId,
  hoveredCardId,
  draggingCardId,
  onCardHover,
  onCardHoverEnd,
  onCardPointerDown,
}) {
  const sharedZoneProps = {
    playerId,
    perspective,
    selectedCardId,
    hoveredCardId,
    draggingCardId,
    onCardHover,
    onCardHoverEnd,
    onCardPointerDown,
  };

  return (
    <section className={`tcg-table-area ${side}`} aria-label={player.name}>
      <div className="tcg-table-player-label">
        <span>{player.name}</span>
        <strong>{player.deckName}</strong>
      </div>

      {side === "opponent" && (
        <CardZone zone="hand" cards={player.zones.hand} {...sharedZoneProps} />
      )}

      <div className="tcg-table-main-row">
        <div className="tcg-mini-zone-stack left">
          {LEFT_ZONES.slice(0, 2).map((zone) => (
            <CardZone
              key={zone}
              zone={zone}
              cards={player.zones[zone]}
              {...sharedZoneProps}
            />
          ))}
        </div>

        <div className="tcg-playfield-cluster">
          <CardZone zone="field" cards={player.zones.field} {...sharedZoneProps} />
          <CardZone
            zone="carrot"
            cards={player.zones.carrot}
            {...sharedZoneProps}
          />
        </div>

        <div className="tcg-mini-zone-stack right">
          {LEFT_ZONES.slice(2).map((zone) => (
            <CardZone
              key={zone}
              zone={zone}
              cards={player.zones[zone]}
              {...sharedZoneProps}
            />
          ))}
        </div>
      </div>

      {side === "local" && (
        <CardZone zone="hand" cards={player.zones.hand} {...sharedZoneProps} />
      )}
    </section>
  );
}

function PlayerControls({
  player,
  playerId,
  notice,
  onDraw,
  onShuffle,
  onAddCarrot,
  onTap,
  onUntapAll,
  onOpenZone,
}) {
  return (
    <section className="tcg-floating-controls" aria-label="Player controls">
      <div className="tcg-floating-controls-title">
        <span>Player Controls</span>
        <strong>{player.name}</strong>
      </div>
      <div className="tcg-draw-buttons">
        <button type="button" onClick={() => onDraw(playerId, 1)}>
          Draw 1
        </button>
        <button type="button" onClick={() => onDraw(playerId, 2)}>
          Draw 2
        </button>
        <button
          type="button"
          onClick={() => onShuffle(playerId)}
          disabled={player.zones.deck.length === 0}
          title={player.zones.deck.length === 0 ? "Deck empty" : "Shuffle Deck"}
        >
          <Shuffle size={16} />
          Shuffle
        </button>
        <button type="button" onClick={() => onAddCarrot(playerId)}>
          <Plus size={16} />
          Carrot
        </button>
        <button type="button" onClick={onTap}>
          <RotateCw size={16} />
          Tap
        </button>
        <button type="button" onClick={() => onUntapAll(playerId)}>
          Active All
        </button>
      </div>
      <div className="tcg-shuffle-notice" aria-live="polite">
        {notice}
      </div>
      <div className="tcg-zone-view-buttons">
        {VIEWABLE_ZONES.map((zone) => (
          <button type="button" key={zone} onClick={() => onOpenZone(playerId, zone)}>
            <Eye size={13} />
            <span>{zone}</span>
            <strong>{player.zones[zone].length}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function CardPreviewPanel({ card, hidden }) {
  if (!card) return null;

  return (
    <aside
      className="tcg-card-preview-panel open"
      aria-label="Card preview"
    >
      <div className="tcg-card-preview-heading">
        <div>
          <span>Card Preview</span>
          <strong>{card && !hidden ? card.name : "Preview"}</strong>
        </div>
      </div>
      <div className="tcg-card-preview-frame">
        {hidden ? (
          <CardBack />
        ) : (
          <PlayableCard card={card} />
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
