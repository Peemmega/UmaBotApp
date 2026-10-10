import { getRaceImage } from "./raceSchedule";

export function getNewsKind(item) {
  const value = String(item.kind || item.type || item.category || "race")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (["event", "activity", "activities", "กิจกรรม"].includes(value)) return "event";
  if (["news", "announcement", "ข่าว", "ข่าวสาร"].includes(value)) return "news";
  if (["patch", "patchnote", "patchnotes", "changelog", "แพตช์โน้ต", "แพตช์โน๊ต"].includes(value)) return "patch";
  return "race";
}

export function getNewsImage(item) {
  return getNewsKind(item) === "race"
    ? getRaceImage(item)
    : item.image_url || item.thumbnail || item.image;
}

export function getNewsDescription(item) {
  return item.description || [item.venue, item.track, item.distance].filter(Boolean).join(" · ") || "รายละเอียดกำลังอัปเดต";
}

export function getNewsTimestamp(item) {
  if (!item.date) return "กำหนดการเร็ว ๆ นี้";
  return `${String(item.date).replaceAll("-", "/")} ${item.time || "--:--"}`;
}
