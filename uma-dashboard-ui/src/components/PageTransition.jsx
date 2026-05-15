import { motion, useReducedMotion } from "framer-motion";
import "../styles/appShell.css";

export default function PageTransition({ children, className = "" }) {
  const prefersReducedMotion = useReducedMotion();

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.42,
        ease: [0.22, 1, 0.36, 1],
      };

  return (
    <motion.main
      className={`page-transition ${className}`.trim()}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
      transition={transition}
    >
      {children}
    </motion.main>
  );
}
