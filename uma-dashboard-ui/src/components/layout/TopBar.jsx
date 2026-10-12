import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, LogOut, Menu, X } from "lucide-react";
import discordIcon from "../../assets/icons/discord_icon.webp";
import mailIcon from "../../assets/icons/mail_icon.webp";
import { playSound } from "../../utils/soundManager";

export default function TopBar({
  unreadCount = 0,
  onMailClick,
  onLogout,
  onHomeClick,
  notificationPermission = "unsupported",
  onEnableNotifications,
  nav,
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.matchMedia("(min-width: 761px)").matches) setMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [mobileNavOpen]);

  return (
    <>
      <header className={`topbar${mobileNavOpen ? " mobile-nav-open" : ""}`}>
        <div className="topbar-main">
        <button type="button" className="topbar-brand" onClick={onHomeClick} aria-label="Tracen Academy — หน้าแรก">
          <span className="topbar-brand-mark">
            <span>TA</span>
          </span>
          <div>
            <p className="topbar-kicker">Umamusume New Frontier</p>
            <span className="dashboard-title">Tracen Academy</span>
          </div>
        </button>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={mobileNavOpen ? "ปิดเมนูหลัก" : "เปิดเมนูหลัก"}
          aria-expanded={mobileNavOpen}
          aria-controls="mobile-primary-navigation"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>

        <div className="dashboard-actions">
          {notificationPermission !== "granted" && notificationPermission !== "unsupported" && (
            <button type="button" className="notification-btn" onClick={onEnableNotifications} aria-label="เปิดการแจ้งเตือน" title="เปิดการแจ้งเตือน">
              <Bell size={18} /><span className="topbar-action-label">แจ้งเตือน</span>
            </button>
          )}

          <a
            className="discord-btn"
            href="https://discord.gg/cwvNJm6R8A"
            target="_blank"
            rel="noreferrer"
            aria-label="เปิด Discord ในแท็บใหม่"
            title="Discord"
            onClick={() => playSound("click")}
          >
            <img src={discordIcon} className="discord-btn-icon" alt="" />
            <span className="topbar-action-label">Discord</span>
          </a>

          <button
            className="mail-btn"
            type="button"
            aria-label={`จดหมาย${unreadCount > 0 ? ` ยังไม่ได้อ่าน ${unreadCount} ฉบับ` : ""}`}
            title="จดหมาย"
            onClick={() => {
              playSound("open");
              onMailClick();
            }}
          >
            <img src={mailIcon} className="mail-icon" alt="" />
            <span className="topbar-action-label">จดหมาย</span>

            {unreadCount > 0 && <span className="mail-badge">{unreadCount}</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              playSound("close");
              onLogout();
            }}
            className="danger-btn"
            aria-label="ออกจากระบบ"
            title="ออกจากระบบ"
          >
            <LogOut size={17} /><span className="topbar-action-label">ออกจากระบบ</span>
          </button>
        </div>
        </div>

        <div className="topbar-nav-desktop">{nav}</div>
      </header>
      {createPortal(
        <>
          {mobileNavOpen && (
            <button
              type="button"
              className="mobile-nav-backdrop"
              aria-label="ปิดเมนูหลัก"
              onClick={() => setMobileNavOpen(false)}
            />
          )}
          <div
            id="mobile-primary-navigation"
            className={`topbar-nav-drawer${mobileNavOpen ? " is-open" : ""}`}
            aria-hidden={!mobileNavOpen}
            inert={!mobileNavOpen}
            onClick={(event) => {
              if (event.target.closest("a, button")) setMobileNavOpen(false);
            }}
          >
            {nav}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
