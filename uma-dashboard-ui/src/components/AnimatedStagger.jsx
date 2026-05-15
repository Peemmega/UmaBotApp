import { motion, useReducedMotion } from "framer-motion";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.985,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.36,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function StaggerContainer({ children, className = "", as = "div" }) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={className}
      variants={prefersReducedMotion ? undefined : containerVariants}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="show"
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({ children, className = "", as = "div", ...props }) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  return (
    <MotionTag
      className={className}
      variants={prefersReducedMotion ? undefined : itemVariants}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
