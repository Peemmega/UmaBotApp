export function statLetter(value = 0) {
  const v = Number(value) || 0;
  if (v >= 9) return "SS";
  if (v >= 8) return "S";
  if (v >= 7) return "A";
  if (v >= 6) return "B";
  if (v >= 5) return "C";
  if (v >= 4) return "D";
  if (v >= 3) return "E";
  if (v >= 2) return "F";
  return "G";
}

export function gradeColor(letter) {
  const map = {
    SS: "rank-ss",
    S: "rank-s",
    A: "rank-a",
    B: "rank-b",
    C: "rank-c",
    D: "rank-d",
    E: "rank-e",
    F: "rank-f",
    G: "rank-g",
  };
  return map[letter] || "rank-g";
}