import React from "react";
import { statLetter } from "../utils/grade";

export default function AptitudeItem({ label, value }) {
  return (
    <div className="aptitude-item">
      <span className="aptitude-name">{label}</span>
      <span className="aptitude-rank">{statLetter(value)}</span>
    </div>
  );
}