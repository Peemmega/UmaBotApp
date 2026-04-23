import React from "react";
import { gradeColor, statLetter } from "../utils/grade";

export default function StatCell({ icon, label, value }) {
  const letter = statLetter(value);

  return (
    <div className="stat-cell">
      <div className={`stat-rank ${gradeColor(letter)}`}>{letter}</div>
      <div className="stat-meta">
        <div className="stat-label">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="stat-value">{value ?? 0}</div>
      </div>
    </div>
  );
}