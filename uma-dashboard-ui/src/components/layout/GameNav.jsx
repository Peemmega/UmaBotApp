import { gameNavItems } from "../../design/navigation";
import { playSound } from "../../utils/soundManager";

export default function GameNav({
  activePage,
  onChangePage,
  items = gameNavItems,
  profileType = "trainee",
}) {
  const baseItems = items.filter(
    (item) => item.key !== "tcg" && item.key !== "race"
  );
  const visibleItems = profileType === "trainee" || profileType === "trainer"
    ? baseItems
    : baseItems.filter((item) => item.key !== "skills");

  return (
    <nav className="sidebar game-nav" aria-label="เมนูหลัก">
      {visibleItems.map((item) => {
        const isActive = !item.href && activePage === item.key;
        const Icon = item.Icon;
        const contents = (
          <>
            <span className="game-nav-active-bar" aria-hidden="true" />
            <span className="sidebar-icon game-nav-icon" aria-hidden="true">
              {Icon ? <Icon size={21} strokeWidth={2.6} /> : item.icon}
            </span>
            <span className="sidebar-label game-nav-label">{item.label}</span>
          </>
        );

        if (item.href) {
          return (
            <a
              key={item.key}
              className="sidebar-btn game-nav-btn"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contents}
            </a>
          );
        }

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
            {contents}
          </button>
        );
      })}
    </nav>
  );
}
