import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CardTable from "../../components/tcg/CardTable";
import DeckSelect from "../../components/tcg/DeckSelect";
import {
  confirmDeck,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  listRooms,
  startRoom,
} from "../../api/tcgApi";
import useTcgSocket from "../../hooks/useTcgSocket";
import { predefinedTcgDecks } from "../../data/tcgDecks";
import { createDeckInstance, createTrainerCard } from "../../data/tcgRuntime";
import TcgDeckSelectOnline from "../tcg/TcgDeckSelectOnline";
import TcgLobbyPage from "../tcg/TcgLobbyPage";
import TcgOnlineBoardPage from "../tcg/TcgOnlineBoardPage";
import TcgRoomPage from "../tcg/TcgRoomPage";
import "../../styles/tcgPage.css";
import "../../styles/tcgTheme.css";

function setupPlayer(playerId, playerName, deck) {
  const deckInstance = createDeckInstance(deck, playerId);
  const trainerCard = createTrainerCard(playerId, deck.trainer);

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
  const [deckOptions] = useState(predefinedTcgDecks);
  const deckMap = useMemo(
    () => new Map(deckOptions.map((deck) => [deck.id, deck])),
    [deckOptions]
  );
  const [mode, setMode] = useState("online");
  const [selections, setSelections] = useState({ player1: "", player2: "" });
  const [players, setPlayers] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState("");
  const [onlineError, setOnlineError] = useState("");
  const createRoomRequestRef = useRef(null);
  const joinRoomRequestRef = useRef(null);

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

  const { status: socketStatus, sendAction } = useTcgSocket({
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

  useEffect(() => {
    if (!room?.room_id || !userId || socketStatus === "open") return undefined;

    const pollRoom = async () => {
      try {
        const nextRoom = await getRoom(room.room_id, userId);
        setRoom(nextRoom);
      } catch (err) {
        setOnlineError(String(err.message || err));
      }
    };

    const intervalId = window.setInterval(pollRoom, 2500);
    return () => window.clearInterval(intervalId);
  }, [room?.room_id, socketStatus, userId]);

  const handleCreateRoom = async () => {
    if (createRoomRequestRef.current) return;
    try {
      setOnlineError("");
      setCreatingRoom(true);
      const request = createRoom(playerPayload);
      createRoomRequestRef.current = request;
      setRoom(await request);
    } catch (err) {
      setOnlineError(String(err.message || err));
    } finally {
      createRoomRequestRef.current = null;
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    if (room?.room_id === roomId || joinRoomRequestRef.current) return;
    try {
      setOnlineError("");
      setJoiningRoomId(roomId);
      const request = joinRoom(roomId, playerPayload);
      joinRoomRequestRef.current = request;
      setRoom(await request);
    } catch (err) {
      setOnlineError(String(err.message || err));
    } finally {
      joinRoomRequestRef.current = null;
      setJoiningRoomId("");
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
            creating={creatingRoom}
            joiningRoomId={joiningRoomId}
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
            decks={deckOptions}
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
          decks={deckOptions}
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
