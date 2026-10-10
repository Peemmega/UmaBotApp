import { createPortal } from "react-dom";
import { useId } from "react";
import { X } from "lucide-react";

export default function Dialog({
  open = true, onClose, title, description, labelledBy, label,
  className = "", backdropClassName = "", closeClassName = "",
  closeDisabled = false, closing = false, profileType, children,
}) {
  const titleId = useId();
  if (!open) return null;
  const modal = <div
    className={`ui-dialog-backdrop ${backdropClassName} ${profileType ? `profile-theme-${profileType}` : ""} ${closing ? "closing" : ""}`.trim()}
    data-ui-backdrop=""
    onMouseDown={(event) => { if (event.target === event.currentTarget && !closeDisabled) onClose?.(); }}
  >
    <section
      className={`ui-dialog ${className} ${closing ? "closing" : ""}`.trim()}
      data-ui-dialog="" role="dialog" aria-modal="true"
      aria-labelledby={labelledBy || (title ? titleId : undefined)} aria-label={label} tabIndex={-1}
    >
      <button type="button" className={`ui-dialog-close ${closeClassName}`.trim()} data-dialog-close="" aria-label="ปิดหน้าต่าง" disabled={closeDisabled} onClick={onClose}><X size={20} /></button>
      {title ? <header className="ui-dialog-heading"><h2 id={titleId}>{title}</h2>{description ? <p>{description}</p> : null}</header> : null}
      {children}
    </section>
  </div>;
  return typeof document === "undefined" ? modal : createPortal(modal, document.body);
}
