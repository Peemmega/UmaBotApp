export default function GameCard({
  as: Component = "section",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={`ui-game-card ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
