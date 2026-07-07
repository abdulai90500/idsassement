import { useState, useEffect, useCallback } from 'react'
import { useStudies } from './hooks/useStudies'
import ProgressBar from './components/ProgressBar'
import StudyList from './components/StudyList'
import StudyCard from './components/StudyCard'

export default function App() {
  const { studies, decide, counts, decided, total } = useStudies()
  const [selectedId, setSelectedId] = useState(studies[0]?.id)
  const [filter, setFilter] = useState('all')

  const filteredStudies = filter === 'all' ? studies : studies.filter(s => s.status === filter)
  const selectedStudy = studies.find(s => s.id === selectedId)
  const selectedIndex = studies.findIndex(s => s.id === selectedId)

  // Navigate to prev/next study in the FULL list (regardless of filter)
  const navigate = useCallback((direction) => {
    const idx = studies.findIndex(s => s.id === selectedId)
    const nextIdx = idx + direction
    if (nextIdx >= 0 && nextIdx < studies.length) {
      setSelectedId(studies[nextIdx].id)
    }
  }, [studies, selectedId])

  // Global keyboard handler
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          navigate(1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          navigate(-1)
          break
        case 'i':
        case 'I':
          if (selectedStudy) {
            decide(selectedStudy.id, selectedStudy.status === 'include' ? 'undecided' : 'include')
          }
          break
        case 'e':
        case 'E':
          if (selectedStudy) {
            decide(selectedStudy.id, selectedStudy.status === 'exclude' ? 'undecided' : 'exclude')
          }
          break
        case 'f':
        case 'F':
          if (selectedStudy) {
            decide(selectedStudy.id, selectedStudy.status === 'flag' ? 'undecided' : 'flag')
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, decide, selectedStudy])

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-logo">
          <div className="logo-dot" aria-hidden="true">SC</div>
          <div>
            <h1>Sabi Core</h1>
            <span>Study Screener</span>
          </div>
        </div>

        <ProgressBar decided={decided} total={total} counts={counts} />

        <div className="kbd-hint" aria-label="Keyboard shortcuts">
          <span>Shortcuts:</span>
          <kbd className="kbd">I</kbd> include
          <kbd className="kbd">E</kbd> exclude
          <kbd className="kbd">F</kbd> flag
          <kbd className="kbd">←</kbd><kbd className="kbd">→</kbd> navigate
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main-content" id="main-content">
        <StudyList
          studies={studies}
          selectedId={selectedId}
          onSelect={setSelectedId}
          filter={filter}
          onFilterChange={setFilter}
        />

        <StudyCard
          study={selectedStudy}
          index={selectedIndex}
          onDecide={decide}
        />
      </main>
    </div>
  )
}
