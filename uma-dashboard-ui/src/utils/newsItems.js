import { getRaceImage } from "./raceSchedule";

export function getNewsKind(item) {
  return String(item.kind || "race").toLowerCase() === "event" ? "event" : "race";
}

export function getNewsImage(item) {
  return getNewsKind(item) === "event"
    ? item.image_url || item.thumbnail || item.image
    : getRaceImage(item);
}

export function getNewsDescription(item) {
  return item.description || [item.venue, item.track, item.distance].filter(Boolean).join(" · ") || "รายละเอียดกำลังอัปเดต";
}

export function getNewsTimestamp(item) {
  if (!item.date) return "กำหนดการเร็ว ๆ นี้";
  return `${String(item.date).replaceAll("-", "/")} ${item.time || "--:--"} (GMT+7)`;
}
