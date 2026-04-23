export default function LoginPage({ appBase }) {
  return (
    
<div
    className="dashboard-page"
    style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
    }}
    >
    
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">Uma Bot Dashboard</div>

                <h1 className="login-title">
                เข้าถึง <span>Discord Account</span> ของคุณ
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
    </div>
  );
}