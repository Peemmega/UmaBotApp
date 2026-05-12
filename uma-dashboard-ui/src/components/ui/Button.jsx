const variantClass = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  ghost: "ui-button-ghost",
  danger: "ui-button-danger",
};

const sizeClass = {
  sm: "ui-button-sm",
  md: "ui-button-md",
  lg: "ui-button-lg",
};

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  type,
  children,
  ...props
}) {
  const buttonType = Component === "button" ? type || "button" : type;

  return (
    <Component
      type={buttonType}
      className={`ui-button ${variantClass[variant] || variantClass.primary} ${
        sizeClass[size] || sizeClass.md
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
