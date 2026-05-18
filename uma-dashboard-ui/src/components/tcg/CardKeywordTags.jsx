import { useState } from "react";

export default function CardKeywordTags({ tags = [] }) {
  const [openTag, setOpenTag] = useState(null);
  const visibleTags = tags.filter((tag) => tag?.label);

  if (!visibleTags.length) return null;

  return (
    <div className="tcg-keyword-tags" aria-label="Card keyword tags">
      {visibleTags.map((tag, index) => {
        const tooltipId = `${tag.name}-${tag.value ?? "base"}-${index}`;
        const isOpen = openTag === tooltipId;

        return (
          <span
            key={tooltipId}
            className={`tcg-keyword-tag ${isOpen ? "open" : ""}`}
            role="button"
            tabIndex={0}
            title={tag.description || tag.label}
            onClick={() => setOpenTag(isOpen ? null : tooltipId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpenTag(isOpen ? null : tooltipId);
              }
              if (event.key === "Escape") {
                setOpenTag(null);
              }
            }}
            onBlur={() => setOpenTag(null)}
          >
            {tag.label}
            {tag.description ? (
              <span className="tcg-keyword-tooltip" role="tooltip">
                {tag.description}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
