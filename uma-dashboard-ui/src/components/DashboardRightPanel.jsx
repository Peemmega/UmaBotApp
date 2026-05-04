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
    <aside className="dashboard-shelll">
      <SkillLoadoutPanel
          userId={userId}
          username={username}
          player={player}
        />

      <RaceCalendar />
    </aside>
  );
}