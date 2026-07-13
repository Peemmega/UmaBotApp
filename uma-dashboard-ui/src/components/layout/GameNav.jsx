import {
  BookOpen,
  PanelsTopLeft,
  CircleHelp,
  Flag,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import { playSound } from "../../utils/soundManager";
import { IS_MAIN_WEB } from "../../api/appConfig";

export const gameNavItems = [
  { key: "profile", label: "โปรไฟล์", Icon: UserRound },
  { key: "chars", label: "ตัวละคร", Icon: UsersRound },
  { key: "races", label: "รายการแข่ง", Icon: Trophy },
  { key: "race", label: "ห้องแข่ง", Icon: Flag },
  { key: "tcg", label: "TCG", Icon: PanelsTopLeft },
  { key: "skills", label: "สกิล", Icon: Sparkles },
  { key: "tutorials", label: "คู่มือ", Icon: BookOpen },
  { key: "qa", label: "Q&A", Icon: CircleHelp },
];

export default function GameNav({
  activePage,
  onChangePage,
  items = gameNavItems,
}) {
  const visibleItems = IS_MAIN_WEB
    ? items.filter((item) => item.key !== "tcg")
    : items;

  return (
    <nav className="sidebar game-nav" aria-label="Game navigation">
      {visibleItems.map((item) => {
        const isActive = activePage === item.key;
        const Icon = item.Icon;

        return (
          <button
            key={item.key}
            type="button"
            className={`sidebar-btn game-nav-btn ${isActive ? "active" : ""}`}
            onClick={() => {
              playSound("click");
              onChangePage(item.key);
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="game-nav-active-bar" aria-hidden="true" />
            <span className="sidebar-icon game-nav-icon" aria-hidden="true">
              {Icon ? <Icon size={21} strokeWidth={2.6} /> : item.icon}
            </span>
            <span className="sidebar-label game-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
