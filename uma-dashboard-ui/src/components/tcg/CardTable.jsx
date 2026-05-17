import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Eye,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import CardZone from "./CardZone";
import PlayableCard from "./PlayableCard";
import ZoneViewerModal from "./ZoneViewerModal";
import CardBack from "./CardBack";
import { createCarrotCard, shuffleCards } from "../../data/tcgRuntime";

const ZONES = ["deck", "hand", "field", "life", "discard", "carrot", "expel"];
const LEFT_ZONES = ["deck", "life", "discard", "expel"];
const VIEWABLE_ZONES = ["deck", "discard", "expel"];
const UNTAP_ZONES = ["field", "carrot"];
const TCG_HOTKEY_CODES = new Set(["KeyR", "KeyD", "KeyH"]);

function isTypingTarget(target) {
  return (
    target instanceof HTMLElement &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.isContentEditable)
  );
}

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
  const tableRootRef = useRef(null);
  const [perspective, setPerspective] = useState("player1");
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);
  const [zoneViewer, setZoneViewer] = useState(null);
  const [shuffleNotice, setShuffleNotice] = useState({});
  const [controlsOpen, setControlsOpen] = useState(false);
  const activePlayerId = onlineMode
    ? currentPlayerId || "player1"
    : perspective;
  const tablePerspective = onlineMode ? activePlayerId : perspective;
  const opponentPlayerId = activePlayerId === "player1" ? "player2" : "player1";
  const topPlayerId = onlineMode ? opponentPlayerId : "player2";
  const bottomPlayerId = onlineMode ? activePlayerId : "player1";
  const dragRef = useRef(null);
  const selectionRef = useRef(null);

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

  const isControllableCard = useCallback(
    (location) => location?.playerId === activePlayerId,
    [activePlayerId]
  );

  const selectCard = useCallback((cardId, hidden = false, options = {}) => {
    void hidden;
    setSelectedCardIds((prev) => {
      if (options.additive) {
        return prev.includes(cardId)
          ? prev.filter((selectedId) => selectedId !== cardId)
          : [...prev, cardId];
      }
      return [cardId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCardIds([]);
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

  const getActionTargets = useCallback(() => {
    const targetCardIds =
      selectedCardIds.length > 0
        ? selectedCardIds
        : hoveredCard?.cardId
          ? [hoveredCard.cardId]
          : [];

    return targetCardIds
      .map((cardId) => findCardLocation(cardId))
      .filter((location) => location && isControllableCard(location));
  }, [
    findCardLocation,
    hoveredCard?.cardId,
    isControllableCard,
    selectedCardIds,
  ]);

  const toggleCards = useCallback(
    (targets = getActionTargets()) => {
      if (targets.length === 0) return;

      if (actionHandlers?.tapCard) {
        targets.forEach((target) => actionHandlers.tapCard(target.card.instanceId));
        return;
      }

      setPlayers((prev) => {
        let next = prev;
        targets.forEach((target) => {
          next = updateCardInPlayers(next, target.card.instanceId, (card) => ({
            ...card,
            status: card.status === "rest" ? "active" : "rest",
          }));
        });
        return next;
      });
    },
    [actionHandlers, getActionTargets, setPlayers]
  );

  const moveCardsToZone = useCallback(
    (toZone, targets = getActionTargets()) => {
      targets.forEach((target) => {
        moveCardBetweenZones({
          cardId: target.card.instanceId,
          fromPlayerId: target.playerId,
          fromZone: target.zone,
          toPlayerId: target.playerId,
          toZone,
        });
      });
    },
    [getActionTargets, moveCardBetweenZones]
  );

  const toggleSelectedCard = useCallback(() => {
    toggleCards();
  }, [toggleCards]);

  useEffect(() => {
    setSelectedCardIds((prev) =>
      prev.filter((cardId) => isControllableCard(findCardLocation(cardId)))
    );
  }, [findCardLocation, isControllableCard, players]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const root = tableRootRef.current;
      const activeElement = document.activeElement;
      const isInsideTable =
        root &&
        ((target instanceof Node && root.contains(target)) ||
          (activeElement instanceof Node && root.contains(activeElement)) ||
          !activeElement ||
          activeElement === document.body);

      if (!isInsideTable || isTypingTarget(target)) return;
      if (
        target instanceof HTMLElement &&
        target.closest('[role="dialog"], .tcg-zone-modal')
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        return;
      }

      if (event.code === "Escape") {
        clearSelection();
        return;
      }

      if (!TCG_HOTKEY_CODES.has(event.code)) return;
      const targets = getActionTargets();
      if (targets.length === 0) return;

      event.preventDefault();
      if (event.code === "KeyR") {
        toggleCards(targets);
      } else if (event.code === "KeyD") {
        moveCardsToZone("discard", targets);
      } else if (event.code === "KeyH") {
        moveCardsToZone("hand", targets);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection, getActionTargets, moveCardsToZone, toggleCards]);

  const blurAndRun = useCallback((event, callback) => {
    event.currentTarget.blur();
    callback();
  }, []);

  const handleBoardPointerDown = useCallback(
    (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        !target.closest(".tcg-playable-card, button, [role='dialog']")
      ) {
        if (event.shiftKey) {
          event.preventDefault();
          const nextSelection = {
            startX: event.clientX,
            startY: event.clientY,
            x: event.clientX,
            y: event.clientY,
          };
          selectionRef.current = nextSelection;
          setSelectionBox(nextSelection);
          return;
        }
        clearSelection();
      }
    },
    [clearSelection]
  );

  const hasSelectedCards = selectedCardIds.length > 0;
  const selectedCount = selectedCardIds.length;

  const handleSelectedTap = useCallback(() => {
    if (!hasSelectedCards) return;
    toggleCards(getActionTargets());
  }, [getActionTargets, hasSelectedCards, toggleCards]);

  const handleSelectedDiscard = useCallback(() => {
    if (!hasSelectedCards) return;
    moveCardsToZone("discard", getActionTargets());
  }, [getActionTargets, hasSelectedCards, moveCardsToZone]);

  const handleSelectedHand = useCallback(() => {
    if (!hasSelectedCards) return;
    moveCardsToZone("hand", getActionTargets());
  }, [getActionTargets, hasSelectedCards, moveCardsToZone]);

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
        selectCard(current.card.instanceId, current.hidden, {
          additive: current.additive,
        });
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

  useEffect(() => {
    if (!selectionBox) return undefined;

    const handlePointerMove = (event) => {
      const current = selectionRef.current;
      if (!current) return;
      const nextSelection = {
        ...current,
        x: event.clientX,
        y: event.clientY,
      };
      selectionRef.current = nextSelection;
      setSelectionBox(nextSelection);
    };

    const handlePointerUp = () => {
      const current = selectionRef.current;
      if (!current) return;

      const left = Math.min(current.startX, current.x);
      const right = Math.max(current.startX, current.x);
      const top = Math.min(current.startY, current.y);
      const bottom = Math.max(current.startY, current.y);
      const selectedIds = Array.from(
        tableRootRef.current?.querySelectorAll(
          `.tcg-card-selectable-target[data-player-id="${activePlayerId}"]`
        ) || []
      )
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.left < right &&
            rect.right > left &&
            rect.top < bottom &&
            rect.bottom > top
          );
        })
        .map((element) => element.getAttribute("data-card-id"))
        .filter(Boolean);

      setSelectedCardIds(Array.from(new Set(selectedIds)));
      selectionRef.current = null;
      setSelectionBox(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [activePlayerId, selectionBox]);

  const handleCardPointerDown = (event, payload) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (payload.playerId !== activePlayerId) return;

    event.preventDefault();
    const nextDrag = {
      ...payload,
      additive: event.ctrlKey || event.metaKey,
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
    <div className="tcg-table-page tcg-fullscreen-layout" ref={tableRootRef}>
      <aside
        className={`tcg-control-rail ${
          controlsOpen ? "controls-open" : "controls-closed"
        }`}
      >
        <header className="tcg-rail-header">
          <div>
            <span>Two Player Sandbox</span>
            <h2>TCG Playtest Board</h2>
            {playerSlotLabel && <p>{playerSlotLabel}</p>}
          </div>
          <button
            type="button"
            className="tcg-controls-toggle"
            aria-expanded={controlsOpen}
            onClick={(event) =>
              blurAndRun(event, () => setControlsOpen((open) => !open))
            }
          >
            <SlidersHorizontal size={16} />
            Controls
          </button>
        </header>

        {!onlineMode && (
          <div className="tcg-perspective-toggle" aria-label="Perspective">
            {["player1", "player2"].map((playerId, index) => (
              <button
                type="button"
                key={playerId}
                className={perspective === playerId ? "active" : ""}
                onClick={(event) =>
                  blurAndRun(event, () => setPerspective(playerId))
                }
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
            onClick={(event) => blurAndRun(event, onResetToDeckSelect)}
          >
            <RotateCcw size={16} />
            Deck Select
          </button>
        )}

        <PlayerControls
          player={activePlayer}
          playerId={activePlayerId}
          notice={shuffleNotice[activePlayerId] || "R Tap • D Discard • H Hand"}
          selectedCount={selectedCount}
          onDraw={handleDraw}
          onShuffle={handleShuffleDeck}
          onAddCarrot={handleAddCarrot}
          onTap={toggleSelectedCard}
          onTapSelected={handleSelectedTap}
          onDiscardSelected={handleSelectedDiscard}
          onHandSelected={handleSelectedHand}
          onUntapAll={handleUntapAll}
          onOpenZone={openZoneViewer}
        />

        <div className="tcg-rules-strip">
          <span>R Tap • D Discard • H Hand</span>
          {selectedCount > 0 && <span>Selected: {selectedCount}</span>}
          <span>Carrot: resource sandbox</span>
          <span>Battle: manual sandbox</span>
          <span>Keyword: future logic</span>
          <span>Preview: {visibleSelectedName}</span>
        </div>
      </aside>

      <main className="tcg-board-stage" onPointerDown={handleBoardPointerDown}>
        <div className="tcg-board tcg-sim-board" onPointerDown={handleBoardPointerDown}>
          <PlayerTableArea
            player={players[topPlayerId]}
            playerId={topPlayerId}
            side="opponent"
            perspective={tablePerspective}
            selectedCardIds={selectedCardIds}
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
            selectedCardIds={selectedCardIds}
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
      {selectionBox && (
        <div
          className="tcg-selection-box"
          style={{
            left: `${Math.min(selectionBox.startX, selectionBox.x)}px`,
            top: `${Math.min(selectionBox.startY, selectionBox.y)}px`,
            width: `${Math.abs(selectionBox.x - selectionBox.startX)}px`,
            height: `${Math.abs(selectionBox.y - selectionBox.startY)}px`,
          }}
          aria-hidden="true"
        />
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
        selectedCardIds={selectedCardIds}
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
  selectedCardIds,
  hoveredCardId,
  draggingCardId,
  onCardHover,
  onCardHoverEnd,
  onCardPointerDown,
}) {
  const sharedZoneProps = {
    playerId,
    perspective,
    selectedCardIds,
    hoveredCardId,
    draggingCardId,
    onCardHover,
    onCardHoverEnd,
    onCardPointerDown,
  };

  return (
    <section className={`tcg-table-area ${side}`} aria-label={player.name}>
      {/* <div className="tcg-table-player-label">
        <span>{player.name}</span>
        <strong>{player.deckName}</strong>
      </div> */}

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
  selectedCount,
  onDraw,
  onShuffle,
  onAddCarrot,
  onTap,
  onTapSelected,
  onDiscardSelected,
  onHandSelected,
  onUntapAll,
  onOpenZone,
}) {
  const blurAndRun = (event, callback) => {
    event.currentTarget.blur();
    callback();
  };

  return (
    <section className="tcg-floating-controls" aria-label="Player controls">
      <div className="tcg-floating-controls-title">
        <span>Player Controls</span>
        <strong>{player.name}</strong>
      </div>
      <div className="tcg-draw-buttons">
        <button
          type="button"
          onClick={(event) => blurAndRun(event, () => onDraw(playerId, 1))}
        >
          Draw 1
        </button>
        <button
          type="button"
          onClick={(event) => blurAndRun(event, () => onDraw(playerId, 2))}
        >
          Draw 2
        </button>
        <button
          type="button"
          onClick={(event) => blurAndRun(event, () => onShuffle(playerId))}
          disabled={player.zones.deck.length === 0}
          title={player.zones.deck.length === 0 ? "Deck empty" : "Shuffle Deck"}
        >
          {/* <Shuffle size={16} /> */}
          Shuffle
        </button>
        <button
          type="button"
          onClick={(event) => blurAndRun(event, () => onAddCarrot(playerId))}
        >
          {/* <Plus size={16} /> */}
          Carrot
        </button>
        <button type="button" onClick={(event) => blurAndRun(event, onTap)}>
          {/* <RotateCw size={16} /> */}
          Tap
        </button>
        <button
          type="button"
          onClick={(event) => blurAndRun(event, () => onUntapAll(playerId))}
        >
          UntapAll
        </button>
        {selectedCount > 0 && (
          <>
            <button type="button" onClick={(event) => blurAndRun(event, onTapSelected)}>
              Tap Selected
            </button>
            <button
              type="button"
              onClick={(event) => blurAndRun(event, onDiscardSelected)}
            >
              Discard Selected
            </button>
            <button type="button" onClick={(event) => blurAndRun(event, onHandSelected)}>
              Move Selected to Hand
            </button>
          </>
        )}
      </div>
      <div className="tcg-shuffle-notice" aria-live="polite">
        {notice}
      </div>
      {selectedCount > 0 && (
        <div className="tcg-selected-count" aria-live="polite">
          Selected: {selectedCount}
        </div>
      )}
      <div className="tcg-zone-view-buttons">
        {VIEWABLE_ZONES.map((zone) => (
          <button
            type="button"
            key={zone}
            onClick={(event) => blurAndRun(event, () => onOpenZone(playerId, zone))}
          >
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
