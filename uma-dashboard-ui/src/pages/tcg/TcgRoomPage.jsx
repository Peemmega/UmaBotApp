export default function TcgRoomPage({
  room,
  userId,
  onStart,
  onLeave,
  starting = false,
  leaving = false,
}) {
  const players = room.players || {};
  const isHost = room.host_id === String(userId);
  const canStart = Boolean(players.player1 && players.player2);
  const busy = starting || leaving;

  return (
    <div className="tcg-online-shell">
      <header className="tcg-online-header">
        <div>
          <span>Waiting Room</span>
          <h2>Room {room.room_code}</h2>
        </div>
        <div className="tcg-online-actions">
          <button type="button" onClick={onLeave} disabled={busy}>
            {leaving ? "Leaving..." : "Leave Room"}
          </button>
          <button type="button" onClick={onStart} disabled={busy || !isHost || !canStart}>
            {starting ? "Starting..." : "Start Game"}
          </button>
        </div>
      </header>

      <div className="tcg-player-slots">
        {["player1", "player2"].map((slot) => {
          const player = players[slot];
          return (
            <div className="tcg-player-slot" key={slot}>
              <strong>{slot === "player1" ? "Player 1" : "Player 2"}</strong>
              {player ? (
                <>
                  {player.avatar_url && <img src={player.avatar_url} alt="" />}
                  <span>{player.username}</span>
                  {player.is_host && <em>Host</em>}
                </>
              ) : (
                <span>Waiting for player...</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
