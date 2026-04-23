import React, { useMemo, useState } from "react";

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

  const [draftPoints, setDraftPoints] = useState(player?.stats_point ?? 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const canDecrease = (key) => {
    const base = player?.[key] ?? 0;
    return (draftStats[key] ?? 0) > base;
  };

  const spentPoints = useMemo(() => {
    return STAT_KEYS.reduce((sum, [key]) => {
      const base = player?.[key] ?? 0;
      const now = draftStats[key] ?? 0;
      return sum + Math.max(0, now - base);
    }, 0);
  }, [draftStats, player]);

  const increaseStat = (key) => {
    if (draftPoints <= 0) return;

    setDraftStats((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) + 1,
    }));
    setDraftPoints((prev) => prev - 1);
  };

  const decreaseStat = (key) => {
    if (!canDecrease(key)) return;

    setDraftStats((prev) => ({
      ...prev,
      [key]: (prev[key] ?? 0) - 1,
    }));
    setDraftPoints((prev) => prev + 1);
  };

  const resetDraft = () => {
    setDraftStats({
      speed: player?.speed ?? 0,
      stamina: player?.stamina ?? 0,
      power: player?.power ?? 0,
      gut: player?.gut ?? 0,
      wit: player?.wit ?? 0,
    });
    setDraftPoints(player?.stats_point ?? 0);
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
          user_id: Number(userId),
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
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stats-modal-header">
          <h3>อัปเดต Stats</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="edit-stats-points-box">
          <div className="edit-stats-points-label">Stats Points คงเหลือ</div>
          <div className="edit-stats-points-value">{draftPoints}</div>
          <div className="edit-stats-points-sub">ใช้ไป {spentPoints} แต้ม</div>
        </div>

        <div className="edit-stats-grid">
          {STAT_KEYS.map(([key, label]) => (
            <div className="edit-stat-card" key={key}>
              <div className="edit-stat-label">{label}</div>
              <div className="edit-stat-current">ปัจจุบัน: {player?.[key] ?? 0}</div>

              <div className="edit-stat-controls">
                <button
                  className="stat-adjust-btn minus"
                  onClick={() => decreaseStat(key)}
                  disabled={!canDecrease(key) || saving}
                >
                  -
                </button>

                <div className="edit-stat-value">{draftStats[key]}</div>

                <button
                  className="stat-adjust-btn plus"
                  onClick={() => increaseStat(key)}
                  disabled={draftPoints <= 0 || saving}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="edit-stats-actions">
          <button className="secondary-btn" onClick={resetDraft} disabled={saving}>
            รีเซ็ต
          </button>
          <button className="save-stats-btn" onClick={saveStats} disabled={saving}>
            {saving ? "Saving..." : "บันทึก"}
          </button>
        </div>

        {message ? <div className="save-message">{message}</div> : null}
      </div>
    </div>
  );
}