import { useEffect } from "react";

const MODAL_SELECTOR = [
  ".mailbox-backdrop",
  ".rename-backdrop",
  ".modal-backdrop",
  ".zone-edit-backdrop",
  ".profile-crop-backdrop",
  ".team-invite-backdrop",
  ".skill-equip-backdrop",
  ".skill-loadout-detail-backdrop",
  ".skill-preset-backdrop",
  ".character-profile-backdrop",
].join(", ");

export default function useModalScrollLock() {
  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    let isLocked = false;
    let scrollY = 0;
    let savedStyles = null;

    const unlock = () => {
      if (!isLocked || !savedStyles) return;

      body.style.position = savedStyles.bodyPosition;
      body.style.top = savedStyles.bodyTop;
      body.style.left = savedStyles.bodyLeft;
      body.style.right = savedStyles.bodyRight;
      body.style.width = savedStyles.bodyWidth;
      body.style.overflow = savedStyles.bodyOverflow;
      root.style.overflow = savedStyles.rootOverflow;
      body.classList.remove("modal-scroll-locked");
      window.scrollTo(0, scrollY);

      isLocked = false;
      savedStyles = null;
    };

    const syncLock = () => {
      const hasOpenModal = Boolean(document.querySelector(MODAL_SELECTOR));
      if (!hasOpenModal) {
        unlock();
        return;
      }

      if (isLocked) return;

      scrollY = window.scrollY;
      savedStyles = {
        bodyPosition: body.style.position,
        bodyTop: body.style.top,
        bodyLeft: body.style.left,
        bodyRight: body.style.right,
        bodyWidth: body.style.width,
        bodyOverflow: body.style.overflow,
        rootOverflow: root.style.overflow,
      };

      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      root.style.overflow = "hidden";
      body.classList.add("modal-scroll-locked");
      isLocked = true;
    };

    const observer = new MutationObserver(syncLock);
    observer.observe(body, { childList: true, subtree: true });
    syncLock();

    return () => {
      observer.disconnect();
      unlock();
    };
  }, []);
}
