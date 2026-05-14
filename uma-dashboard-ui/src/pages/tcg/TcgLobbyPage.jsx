import { RefreshCw, Plus } from "lucide-react";

export default function TcgLobbyPage({
  rooms,
  loading,
  creating,
  joiningRoomId,
  error,
  onRefresh,
  onCreateRoom,
  onJoinRoom,
  onPractice,
}) {
  return (
    <div className="tcg-online-shell">
      <header className="tcg-online-header">
        <div>
          <span>Online Multiplayer</span>
          <h2>TCG Lobby</h2>
        </div>
        <div className="tcg-online-actions">
          <button type="button" onClick={onPractice}>Practice Mode</button>
          <button type="button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button type="button" onClick={onCreateRoom} disabled={loading || creating || Boolean(joiningRoomId)}>
            <Plus size={16} />
            {creating ? "Creating..." : "Create Room"}
          </button>
        </div>
      </header>

      {error && <div className="tcg-online-error">{error}</div>}

      <div className="tcg-room-grid">
        {rooms.length === 0 ? (
          <div className="tcg-online-empty">No rooms yet.</div>
        ) : (
          rooms.map((room) => (
            <article className="tcg-room-card" key={room.room_id}>
              <div>
                <span className={`tcg-room-status ${room.phase}`}>{room.phase}</span>
                <h3>Room {room.room_code}</h3>
                <p>{room.player_count}/{room.max_players} players</p>
              </div>
              <button
                type="button"
                disabled={
                  creating ||
                  Boolean(joiningRoomId) ||
                  room.player_count >= room.max_players ||
                  room.phase !== "waiting"
                }
                onClick={() => onJoinRoom(room.room_id)}
              >
                {joiningRoomId === room.room_id ? "Joining..." : "Join"}
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
