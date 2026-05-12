export default function Badge({ className = "", children, ...props }) {
  return (
    <span className={`ui-badge ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
