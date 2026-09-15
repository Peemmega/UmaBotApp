import NewsScheduleFeed from "../NewsScheduleFeed";

export default function RightRail({ onNavigate }) {
  return (
    <aside className="dashboard-right-panel right-rail">
      <NewsScheduleFeed onViewAll={() => onNavigate("news")} />
    </aside>
  );
}
