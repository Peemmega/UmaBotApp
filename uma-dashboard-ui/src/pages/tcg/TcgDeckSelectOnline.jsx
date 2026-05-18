import { useState } from "react";
import DeckPreviewCard from "../../components/tcg/DeckPreviewCard";

export default function TcgDeckSelectOnline({
  room,
  myPlayerId,
  decks,
  cardsById = {},
  trainers = [],
  onConfirmDeck,
  onConfirmLoadout,
  onLeave,
  error = "",
  confirming = false,
  leaving = false,
}) {
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const deckList = decks || [];
  const confirmed = room.deck_confirmed || {};
  const trainerConfirmed = room.trainer_confirmed || {};
  const youConfirmed = Boolean(confirmed[myPlayerId]);
  const opponentId = myPlayerId === "player1" ? "player2" : "player1";
  const activeTrainerId = selectedTrainerId || trainers[0]?.id || "";

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
            disabled={!selectedDeckId || !activeTrainerId || youConfirmed || confirming || leaving}
            onClick={() =>
              onConfirmLoadout
                ? onConfirmLoadout(selectedDeckId, activeTrainerId)
                : onConfirmDeck(selectedDeckId)
            }
          >
            {confirming ? "Confirming..." : "Confirm Loadout"}
          </button>
        </div>
      </header>

      <div className="tcg-confirm-strip">
        <span>You: {youConfirmed && trainerConfirmed[myPlayerId] ? "Ready" : "Selecting"}</span>
        <span>Opponent: {confirmed[opponentId] && trainerConfirmed[opponentId] ? "Ready" : "Selecting"}</span>
      </div>

      {error && <div className="tcg-online-error">{error}</div>}

      <div className="tcg-trainer-select-grid">
        {trainers.map((trainer) => (
          <button
            type="button"
            key={trainer.id}
            className={
              activeTrainerId === trainer.id
                ? "tcg-trainer-option selected"
                : "tcg-trainer-option"
            }
            onClick={() => setSelectedTrainerId(trainer.id)}
          >
            <img src={trainer.image} alt="" />
            <span>{trainer.name}</span>
          </button>
        ))}
      </div>

      <div className="tcg-online-deck-grid">
        {deckList.map((deck) => (
          <DeckPreviewCard
            key={deck.id}
            deck={deck}
            cardsById={cardsById}
            selected={selectedDeckId === deck.id}
            onSelect={setSelectedDeckId}
          />
        ))}
      </div>
    </div>
  );
}
