import statsImage from "../assets/bg/Gameplay_Stats_Skill_Zone.webp";
import lanesImage from "../assets/bg/gameplay_lane.webp";
import stylesImage from "../assets/bg/gameplay_running_style.webp";
import { raceImageMap } from "../utils/raceSchedule";

export const SYSTEM_TOPICS = [
  {
    id: "stats-skills-zone", label: "Stats / Skills / Zone", title: "ออกวิ่งในแบบของตัวเอง",
    caption: "ค่าสถานะทั้ง 5 ความถนัด สกิล และ Zone ที่คุณจัดเอง ทุกส่วนต่อยอดเป็นแผนลงสนาม",
    intro: "รู้จักพื้นฐานของนักวิ่ง แล้วเลือกสกิลและ Zone ให้ทำงานร่วมกับแผนของคุณ",
    image: statsImage, imageAlt: "ค่าสถานะ ความถนัด Skill Loadout และ Zone ในหน้าโปรไฟล์",
    sections: [["stats", "ค่าสถานะทั้ง 5"], ["aptitudes", "ความถนัด"], ["skills", "หลักการของสกิล"], ["zone", "สร้าง Zone ของคุณ"], ["preparation", "เตรียมพร้อมก่อนวิ่ง"]],
  },
  {
    id: "races", label: "Races", title: "อ่านสนามก่อนออกวิ่ง",
    caption: "พื้นสนาม ระยะ และเส้นทางแต่ละเทิร์น เปลี่ยนจังหวะของการแข่งขันและการใช้พลัง",
    intro: "แต่ละสนามมีเรื่องราวของตัวเอง อ่านพื้นสนาม ระยะ และเส้นทางเพื่อวางแผนทุกเทิร์น",
    image: raceImageMap.JapaneseDerby, imageAlt: "สนาม Japanese Derby",
    sections: [["course", "องค์ประกอบของสนาม"], ["distance", "ระยะและจำนวนเทิร์น"], ["paths", "เส้นทางทั้ง 4 แบบ"], ["course-example", "ลองอ่านเส้นทาง"], ["weather", "สภาพอากาศและกติกา"]],
  },
  {
    id: "lanes", label: "Lanes", title: "เลือกเส้นทางของจังหวะแซง",
    caption: "6 เลน 6 ต้นทุนพลัง เลือกจังหวะ Draft หลบการบัง และใช้ Block เพื่อกลับเข้ากลุ่ม",
    intro: "เลนที่ดีช่วยเก็บพลังและเปิดทางแซง อ่านคู่แข่งล่วงหน้าก่อนเลือกตำแหน่งในเทิร์นถัดไป",
    image: lanesImage, imageAlt: "ตำแหน่งนักวิ่งบนสนาม 6 เลน",
    sections: [["lane-basics", "เลนและการเปลี่ยนเลน"], ["lane-cost", "ต้นทุน Stamina"], ["draft", "วิ่งตามเพื่อ Draft"], ["blocked", "เมื่อถูกบังระหว่างวิ่ง"], ["block-action", "แอ็กชัน Block / Rush"]],
  },
  {
    id: "running-styles", label: "Running Styles", title: "สี่สายวิ่ง สี่จังหวะทำเกม",
    caption: "Front, Pace, Late และ End เลือกสายที่ใช่ แล้วรู้จังหวะความเร็ว ความเร่ง และลูกเต๋าของคุณ",
    intro: "เลือกว่าจะนำ เกาะกลุ่ม หรือเร่งแซงช่วงท้าย แต่ละสายมีจังหวะได้เปรียบต่างกัน",
    image: stylesImage, imageAlt: "อุมะมุสุเมะหลายคนกำลังวิ่งแข่งขัน",
    sections: [["style-selector", "เลือกสายวิ่ง"], ["style-phases", "ความเร็วและโบนัส"], ["dice", "อ่านลูกเต๋า d / kh"], ["pack", "In Pack / Off Pack"]],
  },
];

export const RUNNING_STYLES = [
  { id: "Front", name: "Front Runner", thai: "สายหนี", color: "#25874e", summary: "สร้างระยะนำตั้งแต่ต้น แล้วรักษาพื้นที่ของตัวเองจนเข้าเส้นชัย", strengths: "Off Pack ใน Phase 2–4 มีลูกเต๋าให้คัดมากกว่า In Pack; ค่าสายวิ่งสูงกว่าปกติใน Phase 1–2 และลดลงใน Phase 4", strategy: "เปิดระยะนำ จัดเลนให้โล่ง และเหลือ Stamina ไว้รักษาความเร็วช่วงท้าย", caution: "หากคู่แข่งไล่ทันและกลับเข้า In Pack ตารางเต๋าจะเปลี่ยนทันที" },
  { id: "Pace", name: "Pace Chaser", thai: "สายเกาะกลุ่ม", color: "#c8872f", summary: "รักษาจังหวะในกลุ่ม ใช้ลมบัง แล้วหาทางแซงในช่วงตัดสิน", strengths: "In Pack มีตัวเลือกเต๋ามากขึ้นทุก Phase และมีอัตราเร่งพิเศษตลอดสนาม", strategy: "ตามคู่แข่งในเลนเดียวกันเพื่อ Draft แล้วเปลี่ยนเลนล่วงหน้าก่อนเร่งแซง", caution: "หลุดกลุ่มแล้วเสียความได้เปรียบด้านการคัดเต๋า และเลนแออัดเพิ่มโอกาสถูกบัง" },
  { id: "Late", name: "Late Surger", thai: "สายเร่งแซง", color: "#3b86b4", summary: "ประคองช่วงต้น เก็บพลัง แล้วเปิดเกมไล่กลุ่มในช่วงท้าย", strengths: "Phase 3–4 ได้อัตราเร่งพิเศษ และ In Pack ใน Phase 3–4 เพิ่มจำนวนเต๋าให้คัด", strategy: "รักษาระยะถึงกลุ่ม เก็บสกิลและ Zone ไว้ช่วงท้าย และเตรียมเลนสำหรับจังหวะแซง", caution: "ตกหลังมากเกินไปจะกลับเข้า In Pack ยาก ต้องรักษาพลังให้ถึง Phase 3–4" },
  { id: "End", name: "End Closer", thai: "สายไล่ท้าย", color: "#a65b94", summary: "เก็บแรงในช่วงแรก แล้วทุ่มทุกจังหวะให้การเร่งครั้งสุดท้าย", strengths: "Phase 3–4 ได้อัตราเร่งพิเศษ, Phase 4 มีความเร็วพื้นฐานสูงสุด 25 และ In Pack ใช้ 6dkh4", strategy: "เก็บ Stamina, Zone และสกิลปิดเกมไว้ Phase 4 พร้อมจัดตำแหน่งให้อยู่ใกล้กลุ่ม", caution: "ช่วงต้นมีความเร็วเริ่มต้นต่ำที่สุด และ In Pack ใน Phase 3 ใช้เพียง 2 ลูก" },
];

export const getSystemTopic = (id) => SYSTEM_TOPICS.find((topic) => topic.id === id);

export function followSystemLink(event, onNavigate, topicId) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onNavigate(`system/${topicId}`);
}
