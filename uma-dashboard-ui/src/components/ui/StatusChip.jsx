const statusClass = {
  open: "ui-status-chip-open",
  live: "ui-status-chip-live",
  success: "ui-status-chip-success",
  scheduled: "ui-status-chip-scheduled",
  info: "ui-status-chip-info",
  finished: "ui-status-chip-finished",
  muted: "ui-status-chip-muted",
  locked: "ui-status-chip-locked",
  danger: "ui-status-chip-danger",
};

export default function StatusChip({
  status = "info",
  className = "",
  children,
  ...props
}) {
  return (
    <span
      className={`ui-status-chip ${statusClass[status] || statusClass.info} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
