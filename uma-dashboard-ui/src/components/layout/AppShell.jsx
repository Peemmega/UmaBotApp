import "../../styles/appShell.css";

export default function AppShell({
  topBar,
  rightRail,
  children,
  modals,
  profileType = "trainee",
}) {
  return (
    <div className={`dashboard-page app-shell profile-theme-${profileType}`}>
      {topBar}

      <div className="dashboard-layout app-shell-layout">
        {rightRail}

        <div className="dashboard-shell app-shell-main">{children}</div>
      </div>

      {modals}
    </div>
  );
}
