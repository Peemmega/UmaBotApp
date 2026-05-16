import { useState } from "react";
import DeckPreviewCard from "../../components/tcg/DeckPreviewCard";

export default function TcgDeckSelectOnline({
  room,
  myPlayerId,
  decks,
  onConfirmDeck,
  onLeave,
  error = "",
  confirming = false,
  leaving = false,
}) {
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const deckList = decks || [];
  const confirmed = room.deck_confirmed || {};
  const youConfirmed = Boolean(confirmed[myPlayerId]);
  const opponentId = myPlayerId === "player1" ? "player2" : "player1";

  return (
    <div className="tcg-online-shell">
      <header className="tcg-online-header">
        <div>
          <span>Deck Select</span>
          <h2>Choose Your Deck</h2>
        </div>
        <div className="tcg-online-actions">
          <button type="button" onClick={onLeave} disabled={confirming || leaving}>
            {leaving ? "Leaving..." : "Leave Room"}
          </button>
          <button
            type="button"
            disabled={!selectedDeckId || youConfirmed || confirming || leaving}
            onClick={() => onConfirmDeck(selectedDeckId)}
          >
            {confirming ? "Confirming..." : "Confirm Deck"}
          </button>
        </div>
      </header>

      <div className="tcg-confirm-strip">
        <span>You: {youConfirmed ? "Confirmed" : "Selecting"}</span>
        <span>Opponent: {confirmed[opponentId] ? "Confirmed" : "Selecting"}</span>
      </div>

      {error && <div className="tcg-online-error">{error}</div>}

      <div className="tcg-online-deck-grid">
        {deckList.map((deck) => (
          <DeckPreviewCard
            key={deck.id}
            deck={deck}
            selected={selectedDeckId === deck.id}
            onSelect={setSelectedDeckId}
          />
        ))}
      </div>
    </div>
  );
}
