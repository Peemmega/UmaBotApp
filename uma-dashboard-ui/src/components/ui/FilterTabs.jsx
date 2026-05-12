export default function FilterTabs({
  items,
  value,
  onChange,
  getValue = (item) => item.value ?? item,
  getLabel = (item) => item.label ?? item,
  className = "",
  buttonClassName = "",
}) {
  return (
    <div className={`ui-filter-tabs ${className}`.trim()}>
      {items.map((item) => {
        const itemValue = getValue(item);
        const isActive = value === itemValue;

        return (
          <button
            key={itemValue}
            type="button"
            className={`filter-btn ${isActive ? "active" : ""} ${buttonClassName}`.trim()}
            onClick={() => onChange?.(itemValue, item)}
          >
            {getLabel(item)}
          </button>
        );
      })}
    </div>
  );
}
