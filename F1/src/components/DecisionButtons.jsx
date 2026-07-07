const VERDICTS = [
  {
    key: 'include',
    label: 'Include',
    shortcut: 'I',
    icon: '✓',
    ariaDesc: 'Mark study as include',
  },
  {
    key: 'exclude',
    label: 'Exclude',
    shortcut: 'E',
    icon: '✗',
    ariaDesc: 'Mark study as exclude',
  },
  {
    key: 'flag',
    label: 'Flag for discussion',
    shortcut: 'F',
    icon: '⚑',
    ariaDesc: 'Flag study for discussion',
  },
]

export default function DecisionButtons({ currentStatus, onDecide, studyId }) {
  return (
    <div className="decision-buttons" role="group" aria-label="Screening decision">
      {VERDICTS.map(v => (
        <button
          key={v.key}
          className={`decision-btn ${v.key} ${currentStatus === v.key ? 'active' : ''}`}
          onClick={() => onDecide(studyId, currentStatus === v.key ? 'undecided' : v.key)}
          aria-pressed={currentStatus === v.key}
          aria-label={v.ariaDesc}
          id={`decision-${v.key}`}
          title={`${v.label} (${v.shortcut})`}
        >
          <span aria-hidden="true">{v.icon}</span>
          {v.label}
          <span className="shortcut" aria-hidden="true">{v.shortcut}</span>
        </button>
      ))}
    </div>
  )
}
