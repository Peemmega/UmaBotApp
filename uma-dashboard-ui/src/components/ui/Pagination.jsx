import "./Pagination.css";

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  label = "รายการ",
}) {
  if (pageCount <= 1) return null;

  const currentPage = Math.min(Math.max(page, 1), pageCount);

  return (
    <nav className="ui-pagination" aria-label={`แบ่งหน้า${label}`}>
      <button
        type="button"
        className="ui-pagination-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ก่อนหน้า
      </button>
      <span className="ui-pagination-status" aria-live="polite">
        หน้า {currentPage} / {pageCount}
      </span>
      <button
        type="button"
        className="ui-pagination-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pageCount}
      >
        ถัดไป
      </button>
    </nav>
  );
}
