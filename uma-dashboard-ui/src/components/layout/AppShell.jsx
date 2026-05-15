import "../../styles/appShell.css";

export default function AppShell({
  topBar,
  nav,
  rightRail,
  children,
  modals,
}) {
  return (
    <div className="dashboard-page app-shell">
      {topBar}

      <div className="dashboard-layout app-shell-layout">
        {nav}

        <div className="dashboard-shell app-shell-main">{children}</div>

        {rightRail}
      </div>

      {modals}
    </div>
  );
}
