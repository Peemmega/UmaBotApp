import React from "react";

const menuItems = [
  { key: "profile", label: "Profile" },
  { key: "tutorials", label: "Tutorials" },
  { key: "skills", label: "Skills" },
  { key: "characters", label: "Characters" },
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
          onClick={() => onChangePage(item.key)}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}