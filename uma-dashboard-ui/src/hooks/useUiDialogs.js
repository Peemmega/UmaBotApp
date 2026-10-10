import { useEffect } from "react";
import { BACKDROP_SELECTOR, DIALOG_CLOSE_SELECTOR, DIALOG_LAYER_BASE, DIALOG_SELECTOR, FOCUSABLE_SELECTOR } from "../design/uiConfig";

let nextHeadingId = 0;

function focusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => (
    element.getClientRects().length && !element.closest('[inert], [aria-hidden="true"]')
  ));
}

// Adapts existing feature dialogs without replacing their business logic.
// New <Dialog> surfaces enter the same focus stack through data-ui-dialog.
export default function useUiDialogs() {
  useEffect(() => {
    const dialogs = new Map();
    let currentDialog = null;
    let previousFocus = document.activeElement;
    let layer = DIALOG_LAYER_BASE;

    const syncDialogs = () => {
      const openDialogs = [...document.querySelectorAll(DIALOG_SELECTOR)];
      for (const dialog of openDialogs) {
        if (dialogs.has(dialog)) continue;
        dialogs.set(dialog, {
          opener: dialog.contains(document.activeElement) ? previousFocus : document.activeElement,
        });
        dialog.dataset.uiDialog = "";
        if (!dialog.hasAttribute("role")) dialog.setAttribute("role", "dialog");
        if (!dialog.hasAttribute("aria-modal")) dialog.setAttribute("aria-modal", "true");
        if (!dialog.hasAttribute("tabindex")) dialog.tabIndex = -1;
        if (!dialog.hasAttribute("aria-labelledby") && !dialog.hasAttribute("aria-label")) {
          const heading = dialog.querySelector("h1, h2, h3");
          if (heading) {
            if (!heading.id) heading.id = `ui-dialog-heading-${++nextHeadingId}`;
            dialog.setAttribute("aria-labelledby", heading.id);
          } else dialog.setAttribute("aria-label", "หน้าต่างข้อมูล");
        }
        const backdrop = dialog.closest(BACKDROP_SELECTOR);
        if (backdrop) {
          backdrop.dataset.uiBackdrop = "";
          backdrop.style.setProperty("--ui-dialog-layer", String(layer += 2));
        }
      }

      const nextDialog = [...dialogs.keys()].filter((dialog) => dialog.isConnected).at(-1) || null;
      for (const dialog of openDialogs) dialog.setAttribute("aria-modal", dialog === nextDialog ? "true" : "false");
      if (nextDialog !== currentDialog) {
        const closedDialog = currentDialog;
        const opener = dialogs.get(closedDialog)?.opener;
        currentDialog = nextDialog;
        if (closedDialog && !closedDialog.isConnected && opener?.isConnected &&
          (!nextDialog || nextDialog.contains(opener))) {
          opener.focus({ preventScroll: true });
        }
        if (nextDialog && !nextDialog.contains(document.activeElement)) {
          (nextDialog.querySelector("[autofocus], [data-dialog-autofocus]") ||
            focusableElements(nextDialog)[0] || nextDialog).focus({ preventScroll: true });
        }
      }
      for (const dialog of dialogs.keys()) {
        if (!dialog.isConnected) dialogs.delete(dialog);
      }
    };

    const handleFocus = (event) => {
      if (!currentDialog) {
        // React may autofocus a new dialog before the observer sees it.
        if (!event.target.closest(DIALOG_SELECTOR)) previousFocus = event.target;
        return;
      }
      if (!currentDialog.contains(event.target)) {
        const openingDialog = event.target.closest(DIALOG_SELECTOR);
        if (openingDialog && !dialogs.has(openingDialog)) return;
        (focusableElements(currentDialog)[0] || currentDialog).focus({ preventScroll: true });
      }
    };

    const handleKeyDown = (event) => {
      if (!currentDialog || event.defaultPrevented) return;
      if (event.key === "Escape") {
        const closeButton = currentDialog.querySelector(DIALOG_CLOSE_SELECTOR);
        if (closeButton && !closeButton.disabled && closeButton.getAttribute("aria-disabled") !== "true") {
          event.preventDefault();
          event.stopImmediatePropagation();
          closeButton.click();
        }
      } else if (event.key === "Tab") {
        const focusable = focusableElements(currentDialog);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first) {
          event.preventDefault();
          currentDialog.focus({ preventScroll: true });
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === currentDialog || !currentDialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === currentDialog || !currentDialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const observer = new MutationObserver(syncDialogs);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("keydown", handleKeyDown, true);
    syncDialogs();
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("keydown", handleKeyDown, true);
      dialogs.clear();
    };
  }, []);
}
