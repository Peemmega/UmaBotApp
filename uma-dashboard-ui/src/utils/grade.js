import gradeA from "../assets/grades/A.webp";
import gradeB from "../assets/grades/B.webp";
import gradeC from "../assets/grades/C.webp";
import gradeD from "../assets/grades/D.webp";
import gradeE from "../assets/grades/E.webp";
import gradeF from "../assets/grades/F.webp";
import gradeG from "../assets/grades/G.webp";
import gradeS from "../assets/grades/S.webp";
import gradeSp from "../assets/grades/Sp.webp";
import gradeSS from "../assets/grades/SS.webp";
import gradeSSp from "../assets/grades/SSp.webp";
import gradeUG from "../assets/grades/UG.webp";

export function statLetter(value = 0) {
  const v = Number(value) || 0;
  if (v >= 12) return "UG";
  if (v >= 11) return "SSp";
  if (v >= 10) return "SS";
  if (v >= 9) return "Sp";
  if (v >= 8) return "S";
  if (v >= 7) return "A";
  if (v >= 6) return "B";
  if (v >= 5) return "C";
  if (v >= 4) return "D";
  if (v >= 3) return "E";
  if (v >= 2) return "F";
  return "G";
}

export function getGradeImage(letter) {
  const map = {
    UG: gradeUG,
    SSp: gradeSSp,
    SS: gradeSS,
    Sp: gradeSp,
    S: gradeS,
    A: gradeA,
    B: gradeB,
    C: gradeC,
    D: gradeD,
    E: gradeE,
    F: gradeF,
    G: gradeG,
  };
  return map[letter] || gradeG;
}
