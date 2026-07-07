const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'undecided', label: 'Undecided' },
  { key: 'include',   label: 'Include' },
  { key: 'exclude',   label: 'Exclude' },
  { key: 'flag',      label: 'Flagged' },
]

export default function StudyList({ studies, selectedId, onSelect, filter, onFilterChange }) {
  const filtered = filter === 'all' ? studies : studies.filter(s => s.status === filter)

  return (
    <nav className="study-list-panel" aria-label="Study list">
      {/* Filter chips */}
      <div className="filter-bar" role="group" aria-label="Filter studies">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => onFilterChange(f.key)}
            aria-pressed={filter === f.key}
            id={`filter-${f.key}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Study list */}
      <ol className="study-list-scroll" aria-label="Studies">
        {filtered.length === 0 && (
          <li className="empty-state" style={{ minHeight: '200px' }}>
            <span className="empty-state-icon">🔍</span>
            <span>No studies match this filter</span>
          </li>
        )}
        {filtered.map((study, idx) => {
          const globalIdx = studies.findIndex(s => s.id === study.id)
          const isActive = study.id === selectedId
          return (
            <li key={study.id} style={{ listStyle: 'none' }}>
              <div
                className={`study-list-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelect(study.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(study.id)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'true' : undefined}
                aria-label={`Study ${globalIdx + 1}: ${study.title}, status: ${study.status}`}
                id={`study-item-${study.id}`}
              >
                <span className="study-index" aria-hidden="true">
                  {String(globalIdx + 1).padStart(2, '0')}
                </span>
                <div className="study-list-meta">
                  <div className="study-list-title">{study.title}</div>
                  <div className="study-list-authors">
                    {study.authors.slice(0, 2).join(', ')}
                    {study.authors.length > 2 && ` +${study.authors.length - 2}`}
                    {' · '}{study.year}
                  </div>
                </div>
                <span className={`status-badge ${study.status}`} aria-label={`Status: ${study.status}`}>
                  {study.status === 'flag' ? 'flag' : study.status}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
