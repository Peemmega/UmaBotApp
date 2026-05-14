import { useCallback, useEffect, useMemo, useState } from "react";
import CardTable from "../../components/tcg/CardTable";
import DeckSelect from "../../components/tcg/DeckSelect";
import {
  confirmDeck,
  createRoom,
  joinRoom,
  leaveRoom,
  listRooms,
  startRoom,
} from "../../api/tcgApi";
import useTcgSocket from "../../hooks/useTcgSocket";
import {
  createDeckInstance,
  createTrainerCard,
  predefinedTcgDecks,
} from "../../data/tcgMockCards";
import TcgDeckSelectOnline from "../tcg/TcgDeckSelectOnline";
import TcgLobbyPage from "../tcg/TcgLobbyPage";
import TcgOnlineBoardPage from "../tcg/TcgOnlineBoardPage";
import TcgRoomPage from "../tcg/TcgRoomPage";
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
      field: [{ ...trainerCard, fieldX: 18, fieldY: 18 }],
      discard: [],
      carrot: [],
      expel: [],
    },
  };
}

export default function CardGamePage({
  fullscreen = false,
  onBackToDashboard,
  username = "Unknown",
  userId = "",
  avatarUrl = "",
}) {
  const deckMap = useMemo(
    () => new Map(predefinedTcgDecks.map((deck) => [deck.id, deck])),
    []
  );
  const [mode, setMode] = useState("online");
  const [selections, setSelections] = useState({ player1: "", player2: "" });
  const [players, setPlayers] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [onlineError, setOnlineError] = useState("");

  const playerPayload = useMemo(
    () => ({
      user_id: String(userId),
      username,
      avatar_url: avatarUrl || "",
    }),
    [avatarUrl, userId, username]
  );

  const handleRoomState = useCallback((nextRoom) => {
    setRoom(nextRoom);
  }, []);

  const { sendAction } = useTcgSocket({
    roomId: room?.room_id,
    userId,
    onRoomState: handleRoomState,
  });

  const refreshRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      setOnlineError("");
      const data = await listRooms();
      setRooms(data.rooms || []);
    } catch (err) {
      setOnlineError(String(err.message || err));
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "online" && !room) refreshRooms();
  }, [mode, refreshRooms, room]);

  const handleCreateRoom = async () => {
    try {
      setOnlineError("");
      setRoom(await createRoom(playerPayload));
    } catch (err) {
      setOnlineError(String(err.message || err));
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      setOnlineError("");
      setRoom(await joinRoom(roomId, playerPayload));
    } catch (err) {
      setOnlineError(String(err.message || err));
    }
  };

  const handleLeaveRoom = async () => {
    if (room) {
      try {
        await leaveRoom(room.room_id, playerPayload);
      } catch {
        // Leaving the screen should still work if the room was already gone.
      }
    }
    setRoom(null);
    refreshRooms();
  };

  const handleStartOnlineGame = async () => {
    if (!room) return;
    try {
      setRoom(await startRoom(room.room_id, playerPayload));
    } catch (err) {
      setOnlineError(String(err.message || err));
    }
  };

  const handleConfirmDeck = async (deckId) => {
    if (!room) return;
    try {
      setRoom(await confirmDeck(room.room_id, userId, deckId));
    } catch (err) {
      setOnlineError(String(err.message || err));
    }
  };

  const handleSelectDeck = (playerId, deckId) => {
    setSelections((prev) => ({ ...prev, [playerId]: deckId }));
  };

  const handleStartPractice = () => {
    const player1Deck = deckMap.get(selections.player1);
    const player2Deck = deckMap.get(selections.player2);
    if (!player1Deck || !player2Deck) return;

    setPlayers({
      player1: setupPlayer("player1", "Player 1", player1Deck),
      player2: setupPlayer("player2", "Player 2", player2Deck),
    });
  };

  const backButton = fullscreen && (
    <button type="button" className="tcg-back-home" onClick={onBackToDashboard}>
      Back
    </button>
  );

  if (mode === "online") {
    if (!room) {
      return (
        <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
          {backButton}
          <TcgLobbyPage
            rooms={rooms}
            loading={loadingRooms}
            error={onlineError}
            onRefresh={refreshRooms}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onPractice={() => setMode("practice")}
          />
        </div>
      );
    }

    if (room.phase === "waiting") {
      return (
        <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
          {backButton}
          <TcgRoomPage
            room={room}
            userId={userId}
            onStart={handleStartOnlineGame}
            onLeave={handleLeaveRoom}
          />
        </div>
      );
    }

    if (room.phase === "deck_select") {
      return (
        <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
          {backButton}
          <TcgDeckSelectOnline
            room={room}
            myPlayerId={room.my_player_id}
            onConfirmDeck={handleConfirmDeck}
            onLeave={handleLeaveRoom}
          />
        </div>
      );
    }

    if (room.phase === "in_game") {
      return (
        <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
          <TcgOnlineBoardPage
            room={room}
            sendAction={sendAction}
            onLeave={handleLeaveRoom}
          />
        </div>
      );
    }
  }

  if (!players) {
    return (
      <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
        {backButton}
        <button
          type="button"
          className="tcg-practice-back"
          onClick={() => setMode("online")}
        >
          Online Lobby
        </button>
        <DeckSelect
          selections={selections}
          onSelectDeck={handleSelectDeck}
          onStartGame={handleStartPractice}
        />
      </div>
    );
  }

  return (
    <div className={fullscreen ? "tcg-fullscreen-page" : undefined}>
      {backButton}
      <CardTable
        players={players}
        setPlayers={setPlayers}
        onResetToDeckSelect={() => setPlayers(null)}
      />
    </div>
  );
}
