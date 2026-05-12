export default function SectionHeader({
  title,
  kicker,
  action,
  className = "",
  titleClassName = "",
}) {
  return (
    <div className={`ui-section-header ${className}`.trim()}>
      <div>
        {kicker ? <div className="ui-section-header-kicker">{kicker}</div> : null}
        <h2 className={`ui-section-header-title ${titleClassName}`.trim()}>
          {title}
        </h2>
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}
