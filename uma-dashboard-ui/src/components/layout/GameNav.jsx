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

export const gameNavItems = [
  { key: "profile", label: "Profile", Icon: UserRound },
  { key: "chars", label: "Chars", Icon: UsersRound },
  { key: "races", label: "Races", Icon: Trophy },
  { key: "race", label: "Race", Icon: Flag },
  { key: "tcg", label: "TCG", Icon: PanelsTopLeft },
  { key: "skills", label: "Skills", Icon: Sparkles },
  { key: "tutorials", label: "Tutorials", Icon: BookOpen },
  { key: "qa", label: "Q&A", Icon: CircleHelp },
];

export default function GameNav({
  activePage,
  onChangePage,
  items = gameNavItems,
}) {
  return (
    <nav className="sidebar game-nav" aria-label="Game navigation">
      {items.map((item) => {
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
