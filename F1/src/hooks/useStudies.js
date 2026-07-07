import { useState, useCallback } from 'react'
import studies from '../data/studies.mock.json'

const STORAGE_KEY = 'sabi-screener-decisions'

function loadDecisions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveDecisions(decisions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions))
  } catch {
    // Storage quota exceeded – fail silently
  }
}

export function useStudies() {
  const [decisions, setDecisions] = useState(loadDecisions)

  const decide = useCallback((studyId, verdict) => {
    setDecisions(prev => {
      const next = { ...prev, [studyId]: verdict }
      saveDecisions(next)
      return next
    })
  }, [])

  const getStatus = useCallback(
    (studyId) => decisions[studyId] || 'undecided',
    [decisions]
  )

  const studiesWithStatus = studies.map(s => ({
    ...s,
    status: decisions[s.id] || 'undecided',
  }))

  const counts = studiesWithStatus.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1
      return acc
    },
    { include: 0, exclude: 0, flag: 0, undecided: 0 }
  )

  const decided = studies.length - (counts.undecided || 0)

  return { studies: studiesWithStatus, decide, getStatus, counts, decided, total: studies.length }
}
