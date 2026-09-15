import { ChevronsRight } from "lucide-react";
import { getNewsDescription, getNewsImage, getNewsKind, getNewsTimestamp } from "../utils/newsItems";
import "../styles/newsListingCard.css";

export default function NewsListingCard({ item, onDetails, compact = false }) {
  const kind = getNewsKind(item);
  const image = getNewsImage(item);

  return <article className={`news-listing-card${compact ? " is-compact" : ""}`}>
    {image ? <img className="news-listing-banner" src={image} alt="" loading="lazy" /> : null}
    <div className="news-listing-content">
      <div className="news-listing-meta">
        <span className="news-listing-kind">{kind === "event" ? "Event" : "Race"}</span>
        <time>{getNewsTimestamp(item)}</time>
      </div>
      <h3>{item.name || item.title || item.id}</h3>
      <p>{getNewsDescription(item)}</p>
      <button type="button" className="news-listing-details" onClick={() => onDetails?.(item)}>
        Details <ChevronsRight size={22} strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  </article>;
}
