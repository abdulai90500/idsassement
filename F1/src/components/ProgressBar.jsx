export default function ProgressBar({ decided, total, counts }) {
  const pct = total === 0 ? 0 : Math.round((decided / total) * 100)

  return (
    <div className="progress-wrap" role="region" aria-label="Screening progress">
      <div className="progress-meta">
        <span>{decided} / {total} screened</span>
        <span style={{ display: 'flex', gap: '12px' }}>
          <span style={{ color: 'var(--clr-include)' }}>✓ {counts.include}</span>
          <span style={{ color: 'var(--clr-exclude)' }}>✗ {counts.exclude}</span>
          <span style={{ color: 'var(--clr-flag)' }}>⚑ {counts.flag}</span>
        </span>
      </div>
      <div
        className="progress-bar-outer"
        role="progressbar"
        aria-valuenow={decided}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${pct}% complete`}
      >
        <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
