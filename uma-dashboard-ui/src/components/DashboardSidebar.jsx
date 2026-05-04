import React from "react";
import { playSound } from "../utils/soundManager";

const menuItems = [
  { key: "profile", label: "Profile", icon: "👤" },
  { key: "characters", label: "Characters", icon: "🐴" },
  { key: "races", label: "Races", icon: "🏆" },
  { key: "skills", label: "Skills", icon: "✨" },
  { key: "tutorials", label: "Tutorials", icon: "📖" },
  { key: "qa", label: "Q&A", icon: "❔" },
];

export default function DashboardSidebar({ activePage, onChangePage }) {
  return (
    <aside className="sidebar">
      {menuItems.map((item) => {
        const isActive = activePage === item.key;

        return (
          <button
            key={item.key}
            type="button"
            className={`sidebar-btn ${isActive ? "active" : ""}`}
            onClick={() => {
              playSound("click");
              onChangePage(item.key);
            }}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
            {isActive && <span className="sidebar-arrow">›</span>}
          </button>
        );
      })}
    </aside>
  );
}