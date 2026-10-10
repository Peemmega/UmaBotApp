import React from "react";
import { getGradeImage, statLetter } from "../utils/grade";

export default function AptitudeItem({ label, value, icon }) {
  const letter = statLetter(value);
  const gradeImg = getGradeImage(letter);

  return (
    <div className="aptitude-item">
      <span className="aptitude-label-group">
        {icon ? <span className="aptitude-icon" aria-hidden="true">{icon}</span> : null}
        <span className="aptitude-name">{label}</span>
      </span>
      <img src={gradeImg} alt={letter} className="aptitude-grade-image" />
    </div>
  );
}
