import { ChevronRight } from "lucide-react";

export default function RightRail({ onNavigate }) {
  return (
    <aside className="dashboard-right-panel right-rail">
      <button type="button" className="right-news-shortcut" onClick={() => onNavigate("news")}>
        <span>Community board</span>
        <strong>News</strong>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </aside>
  );
}
