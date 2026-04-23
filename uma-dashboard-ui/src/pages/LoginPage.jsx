import React from "react";
import bgImage from "../assets/bg/profile-bg.png";

export default function LoginPage({ appBase }) {
  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-badge">UmaDnD Dashboard</div>

          <h1 className="login-title">
            Connect your
            <span className="login-title-gradient"> Discord Account</span>
          </h1>

          <p className="login-subtitle">
            เข้าสู่ระบบเพื่อดูโปรไฟล์ ค่าสเตตัส Aptitude และ Zone ของคุณใน UmaDnD
          </p>

          <div className="login-features">
            <div className="login-feature">
              <span>📊</span>
              <span>Profile & Stats</span>
            </div>
            <div className="login-feature">
              <span>🏇</span>
              <span>Aptitude / Attitude</span>
            </div>
            <div className="login-feature">
              <span>🌌</span>
              <span>Zone Overview</span>
            </div>
          </div>

          <button
            onClick={() => {
              window.location.href = `${appBase}/login`;
            }}
            className="login-button"
          >
            <span className="login-button-icon">🎮</span>
            <span>Connect with Discord</span>
          </button>

          <p className="login-footer">
            Login ด้วย Discord เพื่อเข้าถึงข้อมูลผู้เล่นของคุณ
          </p>
        </div>
      </div>
    </div>
  );
}