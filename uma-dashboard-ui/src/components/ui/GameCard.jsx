import Reveal from "./Reveal";

export default function GameCard({
  as: Component = "section",
  className = "",
  children,
  reveal = true,
  ...props
}) {
  return (
    <Reveal as={Component} reveal={reveal} className={`ui-game-card ${className}`.trim()} {...props}>
      {children}
    </Reveal>
  );
}
