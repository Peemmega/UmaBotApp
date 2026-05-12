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

        <main className="dashboard-shell app-shell-main">{children}</main>

        {rightRail}
      </div>

      {modals}
    </div>
  );
}
