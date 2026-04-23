import React from "react";
import { gradeColor, statLetter } from "../utils/grade";

import speedIcon from "../assets/icons/Speed.png";
import staminaIcon from "../assets/icons/Stamina.png";
import powerIcon from "../assets/icons/Power.png";
import gutIcon from "../assets/icons/Gut.png";
import witIcon from "../assets/icons/Wit.png";

const statIcons = {
  speed: speedIcon,
  stamina: staminaIcon,
  power: powerIcon,
  gut: gutIcon,
  wit: witIcon,
};

export default function StatCell({ statKey, label, value }) {
  const letter = statLetter(value);

  return (
    <div className="stat-cell">
      <div className={`stat-rank ${gradeColor(letter)}`}>{letter}</div>

      <div className="stat-meta">
        <div className="stat-label">
          <img src={statIcons[statKey]} alt={label} className="stat-icon" />
          <span>{label}</span>
        </div>
        <div className="stat-value">{value ?? 0}</div>
      </div>
    </div>
  );
}