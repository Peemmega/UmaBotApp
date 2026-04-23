import React from "react";
import EditStatsPanel from "../components/EditStatsPanel";

export default function DashboardPage({
  username,
  userId,
  avatarUrl,
  player,
  setPlayer,
  statsSummary,
  showRaw,
  setShowRaw,
  error,
}) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <EditStatsPanel
          userId={userId}
          player={player}
          onSaved={(updated) => {
            setPlayer((prev) => ({
              ...prev,
              ...updated,
            }));
          }}
        />
      </div>
    </div>
  );
}