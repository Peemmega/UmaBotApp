export const zoneBuildMeta = {
  flat: { label: "Flat Bonus", icon: "✨", format: (v) => `+${v} total` },
  add_dkh: { label: "Extra Dice", icon: "🎲", format: (v) => `+${v} d/kh` },
  cap_floor: { label: "Roll Cap/Floor", icon: "🧱📈", format: (v) => `Cap/Floor +${v}` },
  self_heal_stamina: { label: "Stamina Heal", icon: "💚", format: (v) => `Heal ${v} STA` },
  modify_current_speed: { label: "Accelerator", icon: "👟", format: (v) => `Boost accelerator x${v}` },
};
