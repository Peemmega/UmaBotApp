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
    <div className="stat-cell" data-stat={statKey}>
      <div className="stat-header">
        <span className="stat-icon-frame"><img src={statIcons[statKey]} alt="" className="stat-icon" /></span>
        <span>{label}</span>
      </div>

      <div className="stat-body">
        <img src={gradeImg} alt={letter} className="grade-image" />
        <div className="stat-value">{value ?? 0}</div>
      </div>
    </div>
  );
}
