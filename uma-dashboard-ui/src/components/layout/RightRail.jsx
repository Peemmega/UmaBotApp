import RaceCalendar from "../RaceCalendar";
import SkillLoadoutPanel from "../SkillLoadoutPanel";

export default function RightRail({
  userId,
  username,
  player,
  skillLoadoutVersion,
  page = "profile",
}) {
  const showSkillPreset = page === "profile";

  return (
    <aside className={`dashboard-right-panel right-rail right-rail-${page}`}>
      {showSkillPreset ? (
        <SkillLoadoutPanel
          userId={userId}
          username={player?.username || username}
          player={player}
          refreshKey={skillLoadoutVersion}
        />
      ) : null}

      <RaceCalendar />
    </aside>
  );
}
