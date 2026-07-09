import { useEffect, useMemo, useState } from "react";
import { RACE_API_BASE } from "../api/raceApi";

export default function RaceDicePreviewImage({
  roomId,
  userId,
  version,
  alt = "Race dice preview",
  className = "",
}) {
  const [failed, setFailed] = useState(false);

  const src = useMemo(() => {
    if (!roomId || !userId) return "";
    const cacheVersion = version ?? 0;
    return `${RACE_API_BASE}/race/rooms/${encodeURIComponent(roomId)}/players/${encodeURIComponent(userId)}/preview.webp?v=${encodeURIComponent(cacheVersion)}`;
  }, [roomId, userId, version]);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
