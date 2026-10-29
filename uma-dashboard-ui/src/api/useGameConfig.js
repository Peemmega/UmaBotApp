import { useEffect, useState } from "react";
import { BOT_API_BASE } from "./playerApi";

export function useGameConfig() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${BOT_API_BASE}/game-config`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load game limits");
        return response.json();
      })
      .then((data) => {
        if (!Number.isInteger(data.max_core_stat) || data.max_core_stat < 1 || data.max_core_stat > 12 ||
            !Number.isInteger(data.max_aptitude_level) || data.max_aptitude_level < 1 || data.max_aptitude_level > 8) {
          throw new Error("Invalid game limits");
        }
        setConfig(data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("โหลดขีดจำกัดไม่สำเร็จ กรุณาปิดและลองใหม่อีกครั้ง");
      });
    return () => controller.abort();
  }, []);
  return { config, error };
}
