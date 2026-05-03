import React from "react";

export default function ResourcePill({ icon, label, value }) {
  return (
    <div>
      <div className="resource-label">{label}</div>

      <div className="resource-pill">
        <div className="resource-text">
          <div className="resource-value">{value ?? 0}</div>
        </div>
        <img src={icon} alt={label} className="resource-icon" />
      </div>
    </div>
  );
}