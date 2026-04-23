export const zoneBuildMeta = {
  flat: { label: "Flat Bonus", icon: "✨", format: (v) => `+${v} total` },
  add_dkh: { label: "Extra Dice", icon: "🎲", format: (v) => `+${v} d/kh` },
  floor: { label: "Roll Floor", icon: "🧱", format: (v) => `Floor +${v}` },
  selected_die: { label: "Selected Die", icon: "🎯", format: (v) => `+${v} selected die` },
  cap: { label: "Roll Cap", icon: "📈", format: (v) => `Cap +${v}` },
  self_heal_stamina: { label: "Stamina Heal", icon: "💚", format: (v) => `Heal ${v} STA` },
};