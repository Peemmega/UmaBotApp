import { ChevronsRight } from "lucide-react";
import { getNewsDescription, getNewsImage, getNewsKind, getNewsTimestamp } from "../utils/newsItems";
import "../styles/newsListingCard.css";

export default function NewsListingCard({ item, onDetails, compact = false }) {
  const kind = getNewsKind(item);
  const image = getNewsImage(item);
  const isClickable = typeof onDetails === "function";
  const openDetails = () => onDetails?.(item);

  const handleKeyDown = (event) => {
    if (!isClickable || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openDetails();
  };

  return <article
    className={`news-listing-card is-${kind}${compact ? " is-compact" : ""}${isClickable ? " is-clickable" : ""}`}
    role={isClickable ? "button" : undefined}
    tabIndex={isClickable ? 0 : undefined}
    aria-label={isClickable ? `ดูรายละเอียด ${item.name || item.title || item.id}` : undefined}
    onClick={isClickable ? openDetails : undefined}
    onKeyDown={handleKeyDown}
  >
    <div className="news-listing-content">
      <div className="news-listing-meta">
        <span className="news-listing-kind">{kind === "event" ? "Event" : "Race"}</span>
        <time>{getNewsTimestamp(item)}</time>
      </div>
      <h3>{item.name || item.title || item.id}</h3>
      <p>{getNewsDescription(item)}</p>
      <span className="news-listing-details">
        Details <ChevronsRight size={22} strokeWidth={3} aria-hidden="true" />
      </span>
    </div>
    
    {image ? <img className="news-listing-banner" src={image} alt="" loading="lazy" /> : null}
  </article>;
}
