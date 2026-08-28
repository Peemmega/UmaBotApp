import bgImage from "../assets/bg/profile-bg.webp";
import discordIcon from "../assets/icons/discord_icon.webp";
import { playSound } from "../utils/soundManager";
import "../styles/login.css";
import { Capacitor } from "@capacitor/core";
import { loginWithDiscordApp } from "../services/discordAuth";

const loginErrors = {
  not_a_server_member: "คุณต้องเข้าร่วม Discord server ก่อนจึงจะเข้าใช้งานได้",
  guild_check_failed: "ไม่สามารถตรวจสอบสมาชิก Discord ได้ กรุณาลองใหม่อีกครั้ง",
  guild_check_not_configured: "ระบบยังไม่ได้ตั้งค่า Discord server สำหรับตรวจสอบ",
  discord_login_cancelled: "ยกเลิกการเข้าสู่ระบบ Discord แล้ว",
  invalid_login_request: "คำขอเข้าสู่ระบบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
  discord_login_failed: "เข้าสู่ระบบ Discord ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
};

function LoginFeedback({ loginError }) {
  const isNotMember = loginError === "not_a_server_member";
  const message =
    loginErrors[loginError] || "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง";

  return (
    <div
      className="login-bg-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <main className="login-page">
        <section className="login-card login-feedback-card" role="alert" aria-live="assertive">
          <div className="login-header">Uma Bot Dashboard</div>
          <div className="login-body login-feedback-body">
            <div className="login-feedback-icon" aria-hidden="true">!</div>
            <div className="login-badge">Tracen Academy RP</div>
            <h1 className="login-title">
              {isNotMember ? "ยังเข้าใช้งานไม่ได้" : "เข้าสู่ระบบไม่สำเร็จ"}
            </h1>
            <p className="login-feedback-message">{message}</p>
            {isNotMember && (
              <p className="login-feedback-hint">
                โปรดเข้าร่วม Discord Server ของเราก่อน แล้วกลับมาลองเข้าสู่ระบบอีกครั้ง
              </p>
            )}
            <button
              type="button"
              className="login-feedback-button"
              onClick={() => {
                playSound("click");
                window.location.href = "/";
              }}
            >
              กลับไปหน้าเข้าสู่ระบบ
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage({ appBase, loginError = "" }) {
  if (loginError) {
    return <LoginFeedback loginError={loginError} />;
  }

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
              เชื่อมต่อกับ <span>Discord Account</span> ของคุณ
            </h1>

            {/* <p className="login-subtitle">
              เข้าสู่ระบบเพื่อดูโปรไฟล์ อัพเกรดค่าสเตตัส Aptitude และ Mailbox ของคุณ
            </p> */}

            {/* <div className="login-features">
              <div className="login-feature">📊 Profile & Stats</div>
              <div className="login-feature">🏇 Aptitude</div>
              <div className="login-feature">📬 Mailbox</div>
            </div> */}

            <button
              onClick={() => {
                playSound("click");

                if (Capacitor.isNativePlatform()) {
                  // Android App
                  loginWithDiscordApp();
                } else {
                  // Web Browser
                  window.location.href = `${appBase}/login`;
                }
              }}
              className="login-button"
            >
              <img src={discordIcon} className="login-button-icon" />
              Login ด้วย Discord
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
