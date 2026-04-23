import gradeA from "../assets/grades/A.png";
import gradeB from "../assets/grades/B.png";
import gradeC from "../assets/grades/C.png";
import gradeD from "../assets/grades/D.png";
import gradeE from "../assets/grades/E.png";
import gradeF from "../assets/grades/F.png";
import gradeG from "../assets/grades/G.png";
import gradeS from "../assets/grades/S.png";

export function statLetter(value = 0) {
  const v = Number(value) || 0;
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