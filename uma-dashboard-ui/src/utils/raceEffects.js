function toDescriptor(value) {
  if (!value) return null;
  if (typeof value === "object" && typeof value.type === "string") return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed.type === "string" ? parsed : null;
  } catch {
    const type = value.match(/["']type["']\s*:\s*["']([^"']+)["']/i)?.[1];
    if (!type) return null;
    const valueMatch = value.match(/["']value["']\s*:\s*(-?\d+(?:\.\d+)?)/i)?.[1];
    const duration = value.match(/["']duration["']\s*:\s*["']([^"']+)["']/i)?.[1];
    return { type, ...(valueMatch !== undefined ? { value: Number(valueMatch) } : {}), ...(duration ? { duration } : {}) };
  }
}

function durationText(duration) {
  if (duration === "next_turn") return "ในเทิร์นถัดไป";
  if (duration === "this_turn") return "ในเทิร์นนี้";
  if (duration === "permanent") return "ตลอดการแข่งขัน";
  return duration ? `เป็นเวลา ${duration}` : "";
}

export function describeRaceEffect(effect) {
  const descriptor = toDescriptor(effect);
  if (!descriptor) return typeof effect === "string" ? effect : "";

  const amount = Math.abs(Number(descriptor.value) || 0);
  const duration = durationText(descriptor.duration);

  if (descriptor.type === "modify_enemy_gold_lane_range") {
    const action = Number(descriptor.value) < 0 ? "ลด" : "เพิ่ม";
    return `${action}ช่วงเลน In Pack ของคู่แข่ง ${amount} ${duration}`.trim();
  }

  if (descriptor.type === "modify_gold_lane_range") {
    const action = Number(descriptor.value) < 0 ? "ลด" : "เพิ่ม";
    return `${action}ช่วงเลน In Pack ของตัวเอง ${amount} ${duration}`.trim();
  }

  if (descriptor.type === "modify_current_speed_delta") {
    const action = Number(descriptor.value) < 0 ? "ลด" : "เพิ่ม";
    const subject = Number(descriptor.value) < 0
      ? "CurrentSpeed ของเป้าหมาย"
      : descriptor.target?.scope === "self"
        ? "CurrentSpeed ให้ตัวเอง"
        : "CurrentSpeed ของเป้าหมาย";
    return `${action}${subject} ${amount}${duration ? ` ${duration}` : ""}`.trim();
  }

  if (["recover_stamina", "self_heal_stamina"].includes(descriptor.type)) {
    const percentage = Number(descriptor.value || 0) * 10;
    const action = descriptor.type === "self_heal_stamina" ? "ฟื้นฟู Stamina ให้ตัวเอง" : "ฟื้นฟู Stamina";
    return `${action} +${percentage}%${duration ? ` ${duration}` : ""}`;
  }

  return `${descriptor.type.replace(/_/g, " ")}${amount ? ` ${Number(descriptor.value) > 0 ? "+" : ""}${descriptor.value}` : ""}${duration ? ` ${duration}` : ""}`;
}

export function getRaceEffectDescriptor(effect) {
  return toDescriptor(effect);
}
