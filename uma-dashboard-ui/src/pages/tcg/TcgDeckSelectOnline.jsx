import { useState } from "react";
import { predefinedTcgDecks } from "../../data/tcgMockCards";
import DeckPreviewCard from "../../components/tcg/DeckPreviewCard";

export default function TcgDeckSelectOnline({
  room,
  myPlayerId,
  onConfirmDeck,
  onLeave,
}) {
  const [selectedDeckId, setSelectedDeckId] = useState("");
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
          <button type="button" onClick={onLeave}>Leave Room</button>
          <button
            type="button"
            disabled={!selectedDeckId || youConfirmed}
            onClick={() => onConfirmDeck(selectedDeckId)}
          >
            Confirm Deck
          </button>
        </div>
      </header>

      <div className="tcg-confirm-strip">
        <span>You: {youConfirmed ? "Confirmed" : "Selecting"}</span>
        <span>Opponent: {confirmed[opponentId] ? "Confirmed" : "Selecting"}</span>
      </div>

      <div className="tcg-online-deck-grid">
        {predefinedTcgDecks.map((deck) => (
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
