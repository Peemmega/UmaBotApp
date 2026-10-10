// Shared by the dialog keyboard manager, scroll lock, and legacy UI adapters.
// Add a legacy surface here once; new dialogs use <Dialog> automatically.
export const DIALOG_LAYER_BASE = 12000;
export const DIALOG_SELECTOR = [
  "[data-ui-dialog]", ".mailbox-modal", ".mailbox-invite-dialog",
  ".rename-modal", ".stats-modal", ".zone-edit-modal", ".profile-crop-modal",
  ".team-invite-modal", ".team-member-profile-modal", ".skill-equip-modal",
  ".skill-loadout-detail-modal", ".skill-preset-modal", ".character-profile-modal",
  ".news-detail-modal", ".registration-confirm-modal", ".role-confirm-modal",
  ".tcg-zone-modal", ".tcg-deck-list-modal", ".race-winner-card",
].join(", ");

export const BACKDROP_SELECTOR = [
  "[data-ui-backdrop]", ".mailbox-backdrop", ".rename-backdrop", ".modal-backdrop",
  ".zone-edit-backdrop", ".profile-crop-backdrop", ".team-invite-backdrop",
  ".team-member-profile-backdrop", ".skill-equip-backdrop",
  ".skill-loadout-detail-backdrop", ".skill-preset-backdrop",
  ".character-profile-backdrop", ".news-modal-backdrop",
  ".registration-confirm-backdrop", ".role-confirm-backdrop",
  ".tcg-zone-modal-backdrop", ".tcg-deck-list-backdrop", ".race-winner-overlay",
].join(", ");

export const DIALOG_CLOSE_SELECTOR = [
  "[data-dialog-close]", ".rename-close-btn", ".zone-cancel-btn",
  ".mailbox-footer .mailbox-secondary-btn", ".skill-equip-close",
  ".skill-loadout-detail-close", ".character-profile-close", ".news-modal-close",
  ".registration-confirm-close", ".race-room-close", ".race-history-close",
  ".team-invite-close", ".team-member-profile-close", ".role-confirm-back",
  ".tcg-deck-list-close", 'button[aria-label^="Close"]', 'button[aria-label^="ปิด"]',
].join(", ");

export const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]',
].join(", ");

export const REVEAL_VIEWPORT = { once: true, amount: 0.08 };
export const REVEAL_TRANSITION = { duration: 0.48, ease: [0.22, 1, 0.36, 1] };
