export default function SearchInput({ className = "", type = "search", ...props }) {
  return (
    <input
      type={type}
      className={`ui-search-input search-bar ${className}`.trim()}
      {...props}
    />
  );
}
