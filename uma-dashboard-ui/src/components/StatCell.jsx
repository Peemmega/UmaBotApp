import React from "react";
import { gradeColor, statLetter } from "../utils/grade";

import speedIcon from "../assets/icons/Speed.png";
import staminaIcon from "../assets/icons/Stamina.png";
import powerIcon from "../assets/icons/Power.png";
import gutIcon from "../assets/icons/Gut.png";
import witIcon from "../assets/icons/Wit.png";

const iconMap = {
  speed: speedIcon,
  stamina: staminaIcon,
  power: powerIcon,
  gut: gutIcon,
  wit: witIcon,
};

export default function StatCell({ statKey, label, value }) {
  return (
    <div className="stat-cell">
      
      <div className="stat-label">
        <img src={statIcons[statKey]} className="stat-icon" />
        <span>{label}</span>
      </div>

      <div className="stat-value">{value}</div>

    </div>
  );
}