import { useMemo, useState } from "react";
import CardTable from "../../components/tcg/CardTable";
import DeckSelect from "../../components/tcg/DeckSelect";
import {
  createDeckInstance,
  createTrainerCard,
  predefinedTcgDecks,
} from "../../data/tcgMockCards";
import "../../styles/tcgPage.css";

function setupPlayer(playerId, playerName, deck) {
  const deckInstance = createDeckInstance(deck, playerId);
  const trainerCard = createTrainerCard(playerId);

  return {
    id: playerId,
    name: playerName,
    deckId: deck.id,
    deckName: deck.name,
    trainerCard,
    carrotCounter: 0,
    zones: {
      life: deckInstance.slice(0, 5),
      hand: deckInstance.slice(5, 10),
      deck: deckInstance.slice(10),
      trainer: [trainerCard],
      field: [],
      discard: [],
      carrot: [],
    },
  };
}

export default function CardGamePage({ fullscreen = false, onBackToDashboard }) {
  const deckMap = useMemo(
    () => new Map(predefinedTcgDecks.map((deck) => [deck.id, deck])),
    []
  );
  const [selections, setSelections] = useState({
    player1: "",
    player2: "",
  });
  const [players, setPlayers] = useState(null);

  const handleSelectDeck = (playerId, deckId) => {
    setSelections((prev) => ({
      ...prev,
      [playerId]: deckId,
    }));
  };

  const handleStartGame = () => {
    const player1Deck = deckMap.get(selections.player1);
    const player2Deck = deckMap.get(selections.player2);
    if (!player1Deck || !player2Deck) return;

    setPlayers({
      player1: setupPlayer("player1", "Player 1", player1Deck),
      player2: setupPlayer("player2", "Player 2", player2Deck),
    });
  };

  if (!players) {
    return (
      <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
        {fullscreen && (
          <button
            type="button"
            className="tcg-back-home"
            onClick={onBackToDashboard}
          >
            กลับหน้าหลัก
          </button>
        )}
        <DeckSelect
          selections={selections}
          onSelectDeck={handleSelectDeck}
          onStartGame={handleStartGame}
        />
      </div>
    );
  }

  return (
    <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
      {fullscreen && (
        <button
          type="button"
          className="tcg-back-home"
          onClick={onBackToDashboard}
        >
          กลับหน้าหลัก
        </button>
      )}
      <CardTable
        players={players}
        setPlayers={setPlayers}
        onResetToDeckSelect={() => setPlayers(null)}
      />
    </div>
  );
}
