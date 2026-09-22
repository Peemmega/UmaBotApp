import { useState } from "react";
import NewsDetailsModal from "../NewsDetailsModal";
import NewsScheduleFeed from "../NewsScheduleFeed";

export default function RightRail({ onNavigate, userId, profileType }) {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <aside className="dashboard-right-panel right-rail">
      <NewsScheduleFeed onViewAll={() => onNavigate("news")} onItemSelected={setSelectedItem} />
      <NewsDetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} userId={userId} profileType={profileType} />
    </aside>
  );
}
