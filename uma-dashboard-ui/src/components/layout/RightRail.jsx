import NewsScheduleFeed from "../NewsScheduleFeed";

export default function RightRail({ onNavigate, onOpenNews }) {
  return (
    <aside className="dashboard-right-panel right-rail">
      <NewsScheduleFeed onViewAll={() => onNavigate("news")} onItemSelected={onOpenNews} />
    </aside>
  );
}
