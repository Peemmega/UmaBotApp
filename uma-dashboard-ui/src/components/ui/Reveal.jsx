import { motion, useReducedMotion } from "framer-motion";
import { REVEAL_TRANSITION, REVEAL_VIEWPORT } from "../../design/uiConfig";

const tags = {
  div: motion.div, section: motion.section, article: motion.article,
  header: motion.header, aside: motion.aside, li: motion.li, footer: motion.footer,
  button: motion.button, main: motion.main, nav: motion.nav,
};

export default function Reveal({ as = "div", delay = 0, children, reveal = true, ...props }) {
  const reducedMotion = useReducedMotion();
  const Tag = tags[as];
  if (!Tag) {
    const Element = as;
    return <Element {...props}>{children}</Element>;
  }
  return <Tag
    {...props}
    data-ui-reveal=""
    initial={reducedMotion || !reveal ? false : { opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={REVEAL_VIEWPORT}
    transition={{ ...REVEAL_TRANSITION, duration: reducedMotion || !reveal ? 0 : REVEAL_TRANSITION.duration, delay: reducedMotion ? 0 : Math.min(delay, 0.12) }}
  >{children}</Tag>;
}
