import RaceCalendar from "../RaceCalendar";
import SkillLoadoutPanel from "../SkillLoadoutPanel";

export default function RightRail({
  userId,
  username,
  player,
  skillLoadoutVersion,
}) {
  return (
    <aside className="dashboard-right-panel right-rail">
      {/* <div className="right-rail-heading">
        <span>Live Trainee Desk</span>
      </div> */}

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
