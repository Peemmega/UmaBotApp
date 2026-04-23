export default function LoginPage({ appBase }) {
  return (
    <div className="login-page">
        <div className="login-card">
            <div className="login-header">UmaDnD Dashboard</div>

            <h1 className="login-title">
            Connect your <span>Discord Account</span>
            </h1>

            <p className="login-subtitle">
            เข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์ของคุณ
            </p>

            <button
            onClick={() => (window.location.href = `${appBase}/login`)}
            className="login-button"
            >
            🎮 Connect with Discord
            </button>
        </div>
    </div>
  );
}