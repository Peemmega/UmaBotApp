import { Play } from "lucide-react";
import { predefinedTcgDecks } from "../../data/tcgMockCards";
import DeckPreviewCard from "./DeckPreviewCard";

export default function DeckSelect({
  selections,
  onSelectDeck,
  onStartGame,
}) {
  const canStart = Boolean(selections.player1 && selections.player2);

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
                {predefinedTcgDecks.find(
                  (deck) => deck.id === selections[playerId]
                )?.name || "Not selected"}
              </strong>
            </div>
            <div className="tcg-deck-grid">
              {predefinedTcgDecks.map((deck) => (
                <DeckPreviewCard
                  key={`${playerId}-${deck.id}`}
                  deck={deck}
                  selected={selections[playerId] === deck.id}
                  onSelect={(deckId) => onSelectDeck(playerId, deckId)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
