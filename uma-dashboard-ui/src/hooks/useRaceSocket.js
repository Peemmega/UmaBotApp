import { useEffect, useState } from "react";
import { getRaceSocketUrl } from "../api/raceApi";

export default function useRaceSocket({ roomId, userId, onRoomState }) {
  const [status, setStatus] = useState("closed");

  useEffect(() => {
    if (!roomId || !userId) {
      setStatus("closed");
      return undefined;
    }

    let socket;
    let reconnectTimer;
    let stopped = false;

    const connect = () => {
      setStatus("connecting");
      socket = new WebSocket(getRaceSocketUrl(roomId, userId));

      socket.onopen = () => setStatus("open");
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "RACE_STATE" && message.room) {
            onRoomState(message.room);
          }
        } catch (error) {
          console.error("Race socket message error:", error);
        }
      };
      socket.onerror = () => setStatus("error");
      socket.onclose = () => {
        if (stopped) return;
        setStatus("reconnecting");
        reconnectTimer = window.setTimeout(connect, 1800);
      };
    };

    connect();

    return () => {
      stopped = true;
      window.clearTimeout(reconnectTimer);
      if (socket) socket.close();
      setStatus("closed");
    };
  }, [onRoomState, roomId, userId]);

  return { status };
}
