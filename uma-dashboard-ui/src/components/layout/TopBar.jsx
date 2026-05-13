import discordIcon from "../../assets/icons/discord_icon.webp";
import mailIcon from "../../assets/icons/mail_icon.webp";
import { playSound } from "../../utils/soundManager";

export default function TopBar({ unreadCount = 0, onMailClick, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-brand-mark">
          <span>TA</span>
        </span>
        <div>
          <p className="topbar-kicker">UmaDnD Racing Club</p>
          <h1 className="dashboard-title">Tracen Academy RP</h1>
        </div>
      </div>

      <div className="dashboard-actions">
        <span className="topbar-status">Trainee Desk</span>

        <a
          className="discord-btn"
          href="https://discord.gg/75R2E9PU"
          target="_blank"
          rel="noreferrer"
          onClick={() => playSound("click")}
        >
          <img src={discordIcon} className="discord-btn-icon" alt="" />
          Discord
        </a>

        <button
          className="mail-btn"
          type="button"
          onClick={() => {
            playSound("open");
            onMailClick();
          }}
        >
          <img src={mailIcon} className="mail-icon" alt="" />
          จดหมาย

          {unreadCount > 0 && <span className="mail-badge">{unreadCount}</span>}
        </button>

        <button
          type="button"
          onClick={() => {
            playSound("close");
            onLogout();
          }}
          className="danger-btn"
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}
