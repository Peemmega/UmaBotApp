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
    SS: "from-yellow-300 to-orange-400 text-zinc-900",
    S: "from-orange-300 to-amber-400 text-zinc-900",
    A: "from-emerald-300 to-green-400 text-zinc-900",
    B: "from-cyan-300 to-sky-400 text-zinc-900",
    C: "from-lime-300 to-green-300 text-zinc-900",
    D: "from-sky-300 to-blue-400 text-zinc-900",
    E: "from-fuchsia-300 to-pink-400 text-zinc-900",
    F: "from-violet-300 to-purple-400 text-zinc-900",
    G: "from-zinc-300 to-zinc-400 text-zinc-900",
  };
  return map[letter] || map.G;
}