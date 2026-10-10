import { BookOpen, CalendarDays, Calculator, Flag, Sparkles, Trophy, UserRound, UsersRound, House } from "lucide-react";

export const gameNavItems = [
  { key: "home", label: "หน้าแรก", Icon: House },
  { key: "profile", label: "โปรไฟล์", Icon: UserRound },
  { key: "chars", label: "ตัวละคร", Icon: UsersRound },
  { key: "races", label: "รายการแข่ง", Icon: Trophy },
  { key: "news", label: "ตารางกิจกรรม", Icon: CalendarDays },
  { key: "skills", label: "สกิล", Icon: Sparkles },
  { key: "race", label: "ห้องซ้อมวิ่ง", Icon: Flag },
  { key: "tools", label: "เครื่องมือคำนวณ", Icon: Calculator },
  { key: "tutorials", label: "เอกสาร", Icon: BookOpen, href: "https://docs.google.com/document/d/1Pi9xiyC6ontJzZ-cISxPAxtUi0LBWfMnmoWNUib8uCo/edit?usp=sharing" },
];
