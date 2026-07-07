import DecisionButtons from './DecisionButtons'

export default function StudyCard({ study, index, onDecide }) {
  if (!study) {
    return (
      <div className="study-detail-panel">
        <div className="empty-state">
          <span className="empty-state-icon">📄</span>
          <span>Select a study to begin screening</span>
        </div>
      </div>
    )
  }

  const authorsDisplay = study.authors.length <= 3
    ? study.authors.join(', ')
    : `${study.authors.slice(0, 3).join(', ')} et al.`

  return (
    <article className="study-detail-panel" aria-label={`Study detail: ${study.title}`}>
      <div className="study-detail-scroll" key={study.id}>
        <div className="study-number-label">STUDY {String(index + 1).padStart(2, '0')} OF 50</div>

        <h2 className="study-detail-title" id="study-title">
          {study.title}
        </h2>

        <div className="study-detail-byline">
          <span className="byline-authors">{authorsDisplay}</span>
          <span className="byline-year">{study.year}</span>
          {study.doi && (
            <a
              className="byline-doi"
              href={`https://doi.org/${study.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`DOI: ${study.doi} (opens in new tab)`}
            >
              {study.doi}
            </a>
          )}
        </div>

        <div className="section-label">Abstract</div>
        <p className="abstract-text">{study.abstract}</p>
      </div>

      {/* Decision footer */}
      <footer className="decision-zone" aria-label="Decision controls">
        <span className="decision-label">
          Your decision
          {study.status !== 'undecided' && (
            <span className={`status-badge ${study.status}`} style={{ marginLeft: '10px' }}>
              {study.status}
            </span>
          )}
        </span>
        <DecisionButtons
          currentStatus={study.status}
          onDecide={onDecide}
          studyId={study.id}
        />
        <div className="nav-controls" role="group" aria-label="Navigation">
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ← → to navigate
          </span>
        </div>
      </footer>
    </article>
  )
}
