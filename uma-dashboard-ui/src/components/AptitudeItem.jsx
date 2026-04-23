import React from "react";
import { getGradeImage, statLetter } from "../utils/grade";

export default function AptitudeItem({ label, value }) {
  const letter = statLetter(value);
  const gradeImg = getGradeImage(letter);

  return (
    <div className="aptitude-item">
      <span className="aptitude-name">{label}</span>
      <img src={gradeImg} alt={letter} className="aptitude-grade-image" />
    </div>
  );
}