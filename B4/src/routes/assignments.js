import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../index.js'

const router = Router()

const AssignSchema = z.object({
  studyIds:   z.array(z.string()).min(1),
  reviewerId: z.string(),
  stage:      z.enum(['TITLE_ABSTRACT', 'FULL_TEXT']).default('TITLE_ABSTRACT'),
})

// POST /assignments — assign one or more studies to a reviewer
router.post('/', async (req, res, next) => {
  try {
    const { studyIds, reviewerId, stage } = AssignSchema.parse(req.body)

    // Upsert-style: skip studies already assigned to this reviewer at this stage
    const existing = await prisma.assignment.findMany({
      where: { studyId: { in: studyIds }, reviewerId, stage },
      select: { studyId: true },
    })
    const existingIds = new Set(existing.map(a => a.studyId))
    const newStudyIds = studyIds.filter(id => !existingIds.has(id))

    const assignments = await prisma.assignment.createMany({
      data: newStudyIds.map(studyId => ({ studyId, reviewerId, stage })),
    })

    res.status(201).json({
      created: assignments.count,
      skipped: existingIds.size,
    })
  } catch (err) {
    next(err)
  }
})

// GET /assignments/:reviewerId/pending — studies assigned but not yet decided
router.get('/:reviewerId/pending', async (req, res, next) => {
  try {
    const { stage } = req.query
    const assignments = await prisma.assignment.findMany({
      where: {
        reviewerId: req.params.reviewerId,
        ...(stage ? { stage } : {}),
        decision: null, // no decision recorded yet
      },
      include: { study: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ assignments })
  } catch (err) {
    next(err)
  }
})

export default router
