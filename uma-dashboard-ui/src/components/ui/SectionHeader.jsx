export default function SectionHeader({
  title,
  kicker,
  action,
  className = "",
  titleClassName = "",
  titleId,
  level = 2,
}) {
  const Heading = `h${Math.max(1, Math.min(6, level))}`;
  return (
    <div className={`ui-section-header ${className}`.trim()}>
      <div>
        {kicker ? <div className="ui-section-header-kicker">{kicker}</div> : null}
        <Heading id={titleId} className={`ui-section-header-title ${titleClassName}`.trim()}>
          {title}
        </Heading>
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}
