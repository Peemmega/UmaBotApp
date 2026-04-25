import React from "react";
import discordIcon from "../assets/icons/discord_icon.png";
import mailIcon from "../assets/icons/mail_icon.png";

export default function TopBar({
  unreadCount = 0,
  onMailClick,
  onLogout,
}) {
  return (
    <header className="topbar">
      <div>
                <h1 className="dashboard-title">Tracen Academy RP</h1>
                  </div>
      
                  <div className="dashboard-actions">
                    <a
                      className="discord-btn"
                      href="https://discord.gg/75R2E9PU"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => playSound("click")}
                    >
                      <img src={discordIcon} className="discord-btn-icon" />
                      เข้า Discord
                    </a>
      
                    <button
                      className="mail-btn"
                      onClick={() => {
                        playSound("open");
                        setIsMailboxOpen(true);
                      }}
                    >
                      <img src={mailIcon} className="mail-icon" />
                      จดหมาย
      
                      {unreadCount > 0 && (
                        <span className="mail-badge">{unreadCount}</span>
                      )}
                    </button>
      
                    <button
                      onClick={() => {
                        playSound("close");
                        (window.location.href = "/")
                      }}
                      className="danger-btn"
                    >
                      ออกจากระบบ
                    </button>
                  </div>
      
    </header>
  );
}