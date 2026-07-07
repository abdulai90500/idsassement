import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../index.js'

const router = Router()

// ── Validation schemas ───────────────────────────
const StudySchema = z.object({
  title:    z.string().min(1),
  abstract: z.string().optional(),
  authors:  z.array(z.string()).default([]),
  year:     z.number().int().min(1900).max(2100).optional(),
  doi:      z.string().optional(),
  sourceDb: z.string().optional(),
})

// POST /studies — create a study (idempotent on DOI)
router.post('/', async (req, res, next) => {
  try {
    const data = StudySchema.parse(req.body)

    // If DOI supplied, return existing record rather than duplicating
    if (data.doi) {
      const existing = await prisma.study.findUnique({ where: { doi: data.doi } })
      if (existing) {
        return res.status(200).json({ study: existing, created: false })
      }
    }

    const study = await prisma.study.create({ data })
    res.status(201).json({ study, created: true })
  } catch (err) {
    next(err)
  }
})

// GET /studies — list all studies with optional stage filter
router.get('/', async (req, res, next) => {
  try {
    const studies = await prisma.study.findMany({
      include: {
        assignments: { include: { decision: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ studies })
  } catch (err) {
    next(err)
  }
})

// GET /studies/:id
router.get('/:id', async (req, res, next) => {
  try {
    const study = await prisma.study.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { assignments: { include: { decision: true, reviewer: true } } },
    })
    res.json({ study })
  } catch (err) {
    next(err)
  }
})

export default router
