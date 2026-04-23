export default function ResourcePill({ icon, label, value }) {
  return (
    <div className="resource-pill">
      
      <div className="resource-left">
        <div className="resource-label">{label}</div>
        <div className="resource-value">{value ?? 0}</div>
      </div>

      <img src={icon} className="resource-icon" />

    </div>
  );
}