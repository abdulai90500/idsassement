import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../index.js'

const router = Router()

// GET /conflicts — list all unresolved conflicts (or all if ?resolved=true)
router.get('/', async (req, res, next) => {
  try {
    const showAll = req.query.all === 'true'
    const conflicts = await prisma.conflict.findMany({
      where: showAll ? {} : { resolvedVerdict: null },
      include: {
        study:     true,
        decision1: { include: { assignment: { include: { reviewer: true } } } },
        decision2: { include: { assignment: { include: { reviewer: true } } } },
        resolvedBy: true,
      },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ conflicts, count: conflicts.length })
  } catch (err) {
    next(err)
  }
})

const ResolveSchema = z.object({
  resolvedVerdict: z.enum(['INCLUDE', 'EXCLUDE', 'UNCERTAIN']),
  resolvedById:    z.string(),
})

// POST /conflicts/:id/resolve — a LEAD reviewer resolves a conflict
router.post('/:id/resolve', async (req, res, next) => {
  try {
    const { resolvedVerdict, resolvedById } = ResolveSchema.parse(req.body)

    // Verify the resolver has LEAD or ADMIN role
    const resolver = await prisma.reviewer.findUniqueOrThrow({
      where: { id: resolvedById },
    })
    if (resolver.role === 'REVIEWER') {
      return res.status(403).json({ error: 'Only LEAD or ADMIN reviewers can resolve conflicts.' })
    }

    const conflict = await prisma.conflict.update({
      where: { id: req.params.id },
      data: {
        resolvedVerdict,
        resolvedById,
        resolvedAt: new Date(),
      },
    })
    res.json({ conflict })
  } catch (err) {
    next(err)
  }
})

export default router
