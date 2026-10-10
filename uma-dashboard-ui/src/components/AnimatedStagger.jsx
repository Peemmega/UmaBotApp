import { Children, cloneElement, isValidElement } from "react";
import Reveal from "./ui/Reveal";

export function StaggerContainer({ children, className = "", as: Tag = "div" }) {
  return <Tag className={className}>
    {Children.map(children, (child, index) => (
      isValidElement(child) && child.type === StaggerItem
        ? cloneElement(child, { revealDelay: (index % 3) * 0.045 })
        : child
    ))}
  </Tag>;
}

export function StaggerItem({ children, className = "", as = "div", revealDelay = 0, ...props }) {
  return <Reveal as={as} className={className} delay={revealDelay} whileHover={props.onClick && !props.disabled ? { y: -3 } : undefined} {...props}>{children}</Reveal>;
}
