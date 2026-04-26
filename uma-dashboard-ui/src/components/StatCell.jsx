import React from "react";
import { getGradeImage, statLetter } from "../utils/grade";

import speedIcon from "../assets/icons/Speed.webp";
import staminaIcon from "../assets/icons/Stamina.webp";
import powerIcon from "../assets/icons/Power.webp";
import gutIcon from "../assets/icons/Gut.webp";
import witIcon from "../assets/icons/Wit.webp";

const statIcons = {
  speed: speedIcon,
  stamina: staminaIcon,
  power: powerIcon,
  gut: gutIcon,
  wit: witIcon,
};

export default function StatCell({ statKey, label, value }) {
  const letter = statLetter(value);
  const gradeImg = getGradeImage(letter);

  return (
    <div className="stat-cell">
      <div className="stat-header">
        <img src={statIcons[statKey]} alt={label} className="stat-icon" />
        <span>{label}</span>
      </div>

      <div className="stat-body">
        <img src={gradeImg} alt={letter} className="grade-image" />
        <div className="stat-value">{value ?? 0}</div>
      </div>
    </div>
  );
}