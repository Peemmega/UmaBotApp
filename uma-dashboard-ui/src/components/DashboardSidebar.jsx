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
    <aside className="side-menu">
      {menuItems.map((item) => (
        <button
          key={item.key}
          className={`side-menu-item ${activePage === item.key ? "active" : ""}`}
          onClick={() => {
            playSound("click");
            onChangePage(item.key);
          }}
        >
          <span className="side-menu-icon">{item.icon}</span>
          <span>{item.label}</span>
          {activePage === item.key && <span className="side-menu-arrow">›</span>}
        </button>
      ))}
    </aside>
  );
}