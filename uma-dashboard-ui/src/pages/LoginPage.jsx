import bgImage from "../assets/bg/profile-bg.png";
import discordIcon from "../assets/icons/discord_icon.png";
import { playSound } from "../utils/soundManager";
import "../styles/login.css";

export default function LoginPage({ appBase }) {
  return (
    <div
      className="login-bg-page"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">Uma Bot Dashboard</div>

          <div className="login-body">
            <div className="login-badge">Tracen Academy RP</div>

            <h1 className="login-title">
              Connect your <span>Discord Account</span>
            </h1>

            <p className="login-subtitle">
              เข้าสู่ระบบเพื่อดูโปรไฟล์ ค่าสเตตัส Aptitude และ Mailbox ของคุณ
            </p>

            <div className="login-features">
              <div className="login-feature">📊 Profile & Stats</div>
              <div className="login-feature">🏇 Aptitude</div>
              <div className="login-feature">📬 Mailbox</div>
            </div>

            <button
              onClick={() => {
                playSound("click");
                window.location.href = `${appBase}/login`;
              }}
              className="login-button"
            >
              <img src={discordIcon} className="login-button-icon" />
              Connect with Discord
            </button>

            <div className="login-footer">
              Login ด้วย Discord เพื่อยืนยันตัวตนของคุณ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}