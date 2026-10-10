import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import "../styles/appShell.css";

export default function PageTransition({ children, className = "" }) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!document.body.classList.contains("modal-scroll-locked")) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      };

  return (
    <motion.div
      className={`page-transition ${className}`.trim()}
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
