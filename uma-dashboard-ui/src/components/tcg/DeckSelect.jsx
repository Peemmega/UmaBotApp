import { Play } from "lucide-react";
import { useState } from "react";
import DeckPreviewCard from "./DeckPreviewCard";
import TcgFloatingCardPreview from "./TcgFloatingCardPreview";

export default function DeckSelect({
  decks,
  cardsById = {},
  trainers = [],
  selections,
  onSelectDeck,
  onSelectTrainer,
  onStartGame,
}) {
  const [hoveredPreviewCard, setHoveredPreviewCard] = useState(null);
  const showPreview = (card) => {
    if (!card?.image || card.hidden || card.id === "hidden-card") return;
    setHoveredPreviewCard(card);
  };
  const hidePreview = () => setHoveredPreviewCard(null);
  const deckList = decks || [];
  const canStart = Boolean(
    selections.player1?.deckId &&
      selections.player1?.trainerId &&
      selections.player2?.deckId &&
      selections.player2?.trainerId
  );

  return (
    <div className="tcg-deck-select">
      <header className="tcg-page-header">
        <div>
          <span>Uma TCG Sandbox</span>
          <h2>TCG Playtest</h2>
        </div>
        <button
          type="button"
          className="tcg-primary-action"
          disabled={!canStart}
          onClick={onStartGame}
        >
          <Play size={18} fill="currentColor" />
          Start Game
        </button>
      </header>

      <div className="tcg-rules-strip">
        <span>Start: Life Zone 5</span>
        <span>Opening hand 5</span>
        <span>Draw Phase 2</span>
        <span>Active / Rest ready</span>
      </div>

      <div className="tcg-deck-select-columns">
        {["player1", "player2"].map((playerId, index) => (
          <section className="tcg-deck-select-panel" key={playerId}>
            <div className="tcg-player-select-heading">
              <div>
                <span>Local Player {index + 1}</span>
                <h3>Choose Deck</h3>
              </div>
              <strong>
                {deckList.find(
                  (deck) => deck.id === selections[playerId]?.deckId
                )?.name || "Not selected"}
              </strong>
            </div>
            <div className="tcg-trainer-select-grid">
              {trainers.map((trainer) => (
                <button
                  type="button"
                  key={`${playerId}-${trainer.id}`}
                  className={
                    selections[playerId]?.trainerId === trainer.id
                      ? "tcg-trainer-option selected"
                      : "tcg-trainer-option"
                  }
                  onClick={() => onSelectTrainer(playerId, trainer.id)}
                  onMouseEnter={() => showPreview(trainer)}
                  onMouseLeave={hidePreview}
                  onFocus={() => showPreview(trainer)}
                  onBlur={hidePreview}
                >
                  <img src={trainer.image} alt="" />
                  <span>{trainer.name}</span>
                </button>
              ))}
            </div>
            <div className="tcg-deck-grid">
              {deckList.map((deck) => (
                <DeckPreviewCard
                  key={`${playerId}-${deck.id}`}
                  deck={deck}
                  cardsById={cardsById}
                  selected={selections[playerId]?.deckId === deck.id}
                  onSelect={(deckId) => onSelectDeck(playerId, deckId)}
                  onPreviewCard={setHoveredPreviewCard}
                  onPreviewEnd={hidePreview}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <TcgFloatingCardPreview card={hoveredPreviewCard} />
    </div>
  );
}
