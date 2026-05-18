import { useState } from "react";

export default function CardKeywordTags({
  tags = [],
  showDescriptions = false,
  emptyText = "",
}) {
  const [openTag, setOpenTag] = useState(null);
  const visibleTags = tags.filter((tag) => tag?.label);
  const tagsWithDescriptions = visibleTags.filter((tag) => tag.description);

  if (!visibleTags.length) {
    return emptyText ? (
      <span className="tcg-keyword-empty">{emptyText}</span>
    ) : null;
  }

  return (
    <>
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
      {showDescriptions ? (
        <div className="tcg-keyword-descriptions">
          {tagsWithDescriptions.length ? (
            tagsWithDescriptions.map((tag, index) => (
              <span key={`${tag.name}-${tag.value ?? "base"}-${index}`}>
                <strong>{tag.label}:</strong> {tag.description}
              </span>
            ))
          ) : (
            <span className="tcg-keyword-empty">No keyword abilities</span>
          )}
        </div>
      ) : null}
    </>
  );
}
