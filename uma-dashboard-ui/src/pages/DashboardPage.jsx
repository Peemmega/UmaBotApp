import React, { useState } from "react";

export default function DashboardPage({
  username,
  userId,
  avatarUrl,
  player,
  statsSummary,
  error,
}) {
  const [editStats, setEditStats] = useState({
    speed: player?.speed ?? 0,
    stamina: player?.stamina ?? 0,
    power: player?.power ?? 0,
    gut: player?.gut ?? 0,
    wit: player?.wit ?? 0,
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const changeStat = (key, amount) => {
    setEditStats((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] ?? 0) + amount),
    }));
  };

  const saveStats = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const res = await fetch("https://umadndbot-production.up.railway.app/player/stats/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(userId),
          speed: editStats.speed,
          stamina: editStats.stamina,
          power: editStats.power,
          gut: editStats.gut,
          wit: editStats.wit,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Save failed");
      }

      setSaveMessage("บันทึกสำเร็จ");
    } catch (err) {
      console.error(err);
      setSaveMessage(`บันทึกไม่สำเร็จ: ${String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <section className="sheet-card">
          <div className="section-title">Edit Stats</div>

          <div className="edit-stats-grid">
            {[
              ["speed", "Speed"],
              ["stamina", "Stamina"],
              ["power", "Power"],
              ["gut", "Gut"],
              ["wit", "Wit"],
            ].map(([key, label]) => (
              <div className="edit-stat-card" key={key}>
                <div className="edit-stat-label">{label}</div>

                <div className="edit-stat-controls">
                  <button
                    className="stat-adjust-btn"
                    onClick={() => changeStat(key, -1)}
                  >
                    -
                  </button>

                  <div className="edit-stat-value">{editStats[key]}</div>

                  <button
                    className="stat-adjust-btn"
                    onClick={() => changeStat(key, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="edit-stats-actions">
            <button
              className="save-stats-btn"
              onClick={saveStats}
              disabled={saving}
            >
              {saving ? "Saving..." : "บันทึก"}
            </button>
          </div>

          {saveMessage ? (
            <div className="save-message">{saveMessage}</div>
          ) : null}
        </section>
      </div>
    </div>
  );
}