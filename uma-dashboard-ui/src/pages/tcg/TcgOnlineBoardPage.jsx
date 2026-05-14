import { useMemo } from "react";
import CardTable from "../../components/tcg/CardTable";
import { CARD_DATABASE } from "../../data/tcgCards";

const imageById = new Map(
  Object.values(CARD_DATABASE).map((card) => [card.id, card.image])
);

function hydrateCard(card) {
  if (!card || card.hidden) return card;
  return { ...card, image: imageById.get(card.id) || card.image };
}

function hydratePlayers(players) {
  const next = {};
  Object.entries(players || {}).forEach(([playerId, player]) => {
    const zones = {};
    Object.entries(player.zones || {}).forEach(([zone, cards]) => {
      zones[zone] = cards.map(hydrateCard);
    });
    next[playerId] = { ...player, name: playerId === "player1" ? "Player 1" : "Player 2", zones };
  });
  return next;
}

export default function TcgOnlineBoardPage({ room, sendAction, onLeave }) {
  const players = useMemo(() => hydratePlayers(room.game_state?.players), [room.game_state]);
  const myPlayerId = room.my_player_id || "player1";

  const actionHandlers = {
    draw: (count) => sendAction(count === 2 ? "DRAW_2" : "DRAW"),
    shuffleDeck: () => sendAction("SHUFFLE_DECK"),
    addCarrot: () => sendAction("ADD_CARROT"),
    tapCard: (cardId) => sendAction("TAP_CARD", { cardId }),
    untapAll: () => sendAction("UNTAP_ALL"),
    moveCard: (payload) => sendAction("MOVE_CARD", payload),
  };

  return (
    <div>
      <button type="button" className="tcg-online-leave" onClick={onLeave}>
        Leave Room
      </button>
      <CardTable
        players={players}
        setPlayers={() => {}}
        currentPlayerId={myPlayerId}
        actionHandlers={actionHandlers}
      />
    </div>
  );
}
