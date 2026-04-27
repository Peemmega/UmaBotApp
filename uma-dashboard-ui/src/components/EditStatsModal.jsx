import React, { useMemo, useState } from "react";
import clickSound from "../assets/sounds/click.mp3";
import closeSound from "../assets/sounds/close.mp3";
import plusIcon from "../assets/icons/add.webp";
import minusIcon from "../assets/icons/reduce.webp";

import { playSound } from "../utils/soundManager";

const STAT_KEYS = [
  ["speed", "Speed"],
  ["stamina", "Stamina"],
  ["power", "Power"],
  ["gut", "Gut"],
  ["wit", "Wit"],
];

export default function EditStatsModal({ userId, player, onClose, onSaved }) {
  const [draftStats, setDraftStats] = useState({
    speed: player?.speed ?? 0,
    stamina: player?.stamina ?? 0,
    power: player?.power ?? 0,
    gut: player?.gut ?? 0,
    wit: player?.wit ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const totalPool = useMemo(() => {
    return (
      (player?.speed ?? 0) +
      (player?.stamina ?? 0) +
      (player?.power ?? 0) +
      (player?.gut ?? 0) +
      (player?.wit ?? 0) +
      (player?.stats_point ?? 0)
    );
  }, [player]);

  const usedPoints = useMemo(() => {
    return (
      (draftStats.speed ?? 0) +
      (draftStats.stamina ?? 0) +
      (draftStats.power ?? 0) +
      (draftStats.gut ?? 0) +
      (draftStats.wit ?? 0)
    );
  }, [draftStats]);

  const draftPoints = totalPool - usedPoints;

  const increaseStat = (key) => {
    if (draftPoints <= 0) return;

    setDraftStats((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }));
  };

  const decreaseStat = (key) => {
    if ((draftStats[key] ?? 0) <= 1) return;

    setDraftStats((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) - 1,
    }));
  };

  const resetDraft = () => {
  setDraftStats({
    speed: 1,
    stamina: 1,
    power: 1,
    gut: 1,
    wit: 1,
  });

  setMessage("");
};

  const saveStats = async () => {
    try {
      setSaving(true);
      setMessage("");

      const res = await fetch("https://umadndbot-production.up.railway.app/player/stats/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          speed: draftStats.speed,
          stamina: draftStats.stamina,
          power: draftStats.power,
          gut: draftStats.gut,
          wit: draftStats.wit,
          stats_point: draftPoints,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Save failed");
      }

      setMessage("บันทึกสำเร็จ");

      onSaved?.({
        ...draftStats,
        stats_point: draftPoints,
      });
    } catch (err) {
      console.error(err);
      setMessage(`บันทึกไม่สำเร็จ: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="stats-modal stats-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="edit-stats-grid">
          {STAT_KEYS.map(([key, label]) => {
            const value = draftStats[key] ?? 1;

            return (
              <div className="edit-stat-card" key={key}>
                <div className="edit-stat-label">{label}</div>

                <div className="edit-stat-controls">
                  <button
                    className={`stat-adjust-btn ${value <= 1 ? "disabled" : ""}`}
                    onClick={() => decreaseStat(key)}
                    disabled={value <= 1 || saving}
                  >
                    <img src={minusIcon} alt="minus" />
                  </button>

                  <div className="stat-value">{value}</div>

                  <button
                    className="stat-adjust-btn plus"
                    onClick={() => increaseStat(key)}
                    disabled={draftPoints <= 0 || saving}
                  >
                    <img src={plusIcon} alt="plus" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="edit-stats-points-box">
          <div className="edit-stats-points-label">Stats Points คงเหลือ</div>
          <div className="edit-stats-points-value">{draftPoints}</div>
          <div className="edit-stats-points-sub">
            แต้มรวมทั้งหมด {totalPool}
          </div>
        </div>

       

        <div className="edit-stats-actions">
          <button className="white-btn" onClick={() => {
              playSound("close"); 
              resetDraft()
            }}
            disabled={saving}>
            รีเซ็ต
          </button>
          <button className="green-btn" onClick={() => {
              playSound("click"); 
              saveStats()
            }} disabled={saving}>
            {saving ? "Saving..." : "บันทึก"}
          </button>
        </div>

        {message ? <div className="save-message">{message}</div> : null}
      </div>
    </div>
  );
}