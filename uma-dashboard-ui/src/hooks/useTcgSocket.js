import { useEffect, useRef, useState } from "react";
import { getSocketUrl } from "../api/tcgApi";

export default function useTcgSocket({ roomId, userId, onRoomState }) {
  const [status, setStatus] = useState("closed");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) return undefined;

    const socket = new WebSocket(getSocketUrl(roomId, userId));
    socketRef.current = socket;
    setStatus("connecting");

    socket.onopen = () => setStatus("open");
    socket.onclose = () => setStatus("closed");
    socket.onerror = () => setStatus("error");
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "ROOM_STATE") {
        onRoomState?.(message.room);
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [onRoomState, roomId, userId]);

  const sendAction = (type, payload = {}) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type, payload }));
  };

  return { status, sendAction };
}
