import { Router } from 'express'
import { stringify } from 'csv-stringify/sync'
import { prisma } from '../index.js'

const router = Router()

/**
 * GET /export/csv — export final screening decisions as CSV.
 *
 * For each study, we derive a "final verdict":
 *   - If there's a resolved conflict → use resolvedVerdict
 *   - If both reviewers agreed → use that shared verdict
 *   - Otherwise → "PENDING"
 */
router.get('/csv', async (req, res, next) => {
  try {
    const { stage = 'TITLE_ABSTRACT' } = req.query

    const studies = await prisma.study.findMany({
      include: {
        assignments: {
          where: { stage },
          include: {
            decision: true,
            reviewer: true,
          },
        },
        conflicts: {
          where: { stage, resolvedVerdict: { not: null } },
          orderBy: { resolvedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const rows = studies.map(study => {
      const decisions = study.assignments
        .map(a => a.decision)
        .filter(Boolean)

      const resolvedConflict = study.conflicts[0]

      let finalVerdict = 'PENDING'
      if (resolvedConflict?.resolvedVerdict) {
        finalVerdict = resolvedConflict.resolvedVerdict
      } else if (decisions.length >= 2) {
        const verdicts = new Set(decisions.map(d => d.verdict))
        if (verdicts.size === 1) {
          finalVerdict = [...verdicts][0] // consensus
        } else {
          finalVerdict = 'CONFLICT'
        }
      } else if (decisions.length === 1) {
        finalVerdict = decisions[0].verdict + '_UNREVIEWED'
      }

      const reviewerNotes = study.assignments
        .filter(a => a.decision?.note)
        .map(a => `${a.reviewer.name}: ${a.decision.note}`)
        .join(' | ')

      return {
        study_id:      study.id,
        doi:           study.doi || '',
        title:         study.title,
        year:          study.year || '',
        authors:       study.authors.join('; '),
        stage,
        final_verdict: finalVerdict,
        reviewer_count: decisions.length,
        notes:         reviewerNotes,
        exported_at:   new Date().toISOString(),
      }
    })

    const csv = stringify(rows, { header: true })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="screening-decisions-${stage.toLowerCase()}.csv"`)
    res.send(csv)
  } catch (err) {
    next(err)
  }
})

export default router
