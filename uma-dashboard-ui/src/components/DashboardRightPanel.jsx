import React from "react";
import RaceCalendar from "./RaceCalendar";
import SkillLoadoutPanel from "./SkillLoadoutPanel";

export default function DashboardRightPanel({
  activePage,
  userId,
  username,
  player,
}) {
  return (
    <aside className="dashboard-shell">
      <SkillLoadoutPanel
        userId={userId}
        username={player?.username || username}
        player={player}
        refreshKey={skillLoadoutVersion}
      />

      <RaceCalendar />
    </aside>
  );
}