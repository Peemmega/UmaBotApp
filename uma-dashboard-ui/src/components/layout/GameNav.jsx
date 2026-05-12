import { playSound } from "../../utils/soundManager";

export const gameNavItems = [
  { key: "profile", label: "Profile", icon: "\u{1F464}" },
  { key: "chars", label: "Chars", icon: "\u{1F434}" },
  { key: "races", label: "Races", icon: "\u{1F3C6}" },
  { key: "skills", label: "Skills", icon: "\u2728" },
  { key: "tutorials", label: "Tutorials", icon: "\u{1F4D6}" },
  { key: "qa", label: "Q&A", icon: "\u2754" },
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
            <span className="sidebar-icon game-nav-icon">{item.icon}</span>
            <span className="sidebar-label game-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
