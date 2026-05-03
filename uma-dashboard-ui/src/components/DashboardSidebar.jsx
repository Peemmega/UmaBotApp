import React from "react";
import { playSound } from "../utils/soundManager";

const menuItems = [
  { key: "profile", label: "Profile" },
  { key: "characters", label: "Characters" },
  { key: "races", label: "Races" },
  { key: "skills", label: "Skills" },
  { key: "tutorials", label: "Tutorials" },
  { key: "qa", label: "Q&A" },
];

export default function DashboardSidebar({ activePage, onChangePage }) {
  return (
    <aside className="sidebar">
      {menuItems.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`sidebar-btn ${activePage === item.key ? "active" : ""}`}
          onClick={() => {
            playSound("click");
            onChangePage(item.key);
          }}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}