import { useEffect, useRef } from "react";
import "../../styles/appShell.css";

export default function AppShell({
  topBar,
  children,
  modals,
  profileType = "trainee",
}) {
  const shellRef = useRef(null);
  useEffect(() => {
    const body = document.body;
    const previousTheme = body.dataset.profileTheme;
    body.dataset.profileTheme = profileType;
    return () => {
      if (previousTheme) body.dataset.profileTheme = previousTheme;
      else delete body.dataset.profileTheme;
    };
  }, [profileType]);

  useEffect(() => {
    const shell = shellRef.current;
    const header = shell?.querySelector(".topbar");
    if (!header) return;
    const measure = () => shell.style.setProperty("--ui-topbar-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={shellRef} className={`dashboard-page app-shell profile-theme-${profileType}`}>
      <a className="ui-skip-link" href="#dashboard-content">ข้ามไปยังเนื้อหา</a>
      {topBar}

      <div className="dashboard-layout app-shell-layout">
        <div id="dashboard-content" tabIndex={-1} className="dashboard-shell app-shell-main">{children}</div>
      </div>

      {modals}
    </div>
  );
}
