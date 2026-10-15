export default function SectionCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`section-card ${className}`}>
      {(title || subtitle || actions) ? (
        <header className="section-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="section-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="section-body">{children}</div>
    </section>
  );
}
