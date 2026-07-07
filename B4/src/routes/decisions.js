import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../index.js'

const router = Router()

const DecisionSchema = z.object({
  assignmentId: z.string(),
  verdict:      z.enum(['INCLUDE', 'EXCLUDE', 'UNCERTAIN']),
  note:         z.string().optional(),
})

/**
 * POST /decisions — record a reviewer's decision.
 *
 * After saving, checks whether the same study already has a DIFFERENT decision
 * at the same stage from another reviewer. If so, creates a Conflict record.
 */
router.post('/', async (req, res, next) => {
  try {
    const { assignmentId, verdict, note } = DecisionSchema.parse(req.body)

    // Upsert: allow updating a decision (e.g. reviewer changes their mind)
    const decision = await prisma.decision.upsert({
      where:  { assignmentId },
      create: { assignmentId, verdict, note },
      update: { verdict, note },
      include: { assignment: { include: { study: true } } },
    })

    const { studyId, stage } = decision.assignment

    // ── Conflict detection ──────────────────────────────────────────────────
    // Find all OTHER decisions for the same study + stage
    const otherDecisions = await prisma.decision.findMany({
      where: {
        assignment: { studyId, stage },
        id: { not: decision.id },
      },
    })

    let conflict = null
    for (const other of otherDecisions) {
      if (other.verdict !== verdict) {
        // Disagreement found — upsert a Conflict record
        // Use consistent ordering of decision IDs to avoid duplicate conflicts
        const [d1Id, d2Id] = [decision.id, other.id].sort()
        conflict = await prisma.conflict.upsert({
          where: {
            studyId_stage_decision1Id_decision2Id: {
              studyId, stage, decision1Id: d1Id, decision2Id: d2Id,
            },
          },
          create: { studyId, stage, decision1Id: d1Id, decision2Id: d2Id },
          update: {}, // Already exists — don't overwrite a resolved conflict
        })
        break // One conflict record per study+stage pair is sufficient
      }
    }

    res.status(201).json({ decision, conflict })
  } catch (err) {
    next(err)
  }
})

// GET /decisions/:assignmentId — get the decision for an assignment
router.get('/:assignmentId', async (req, res, next) => {
  try {
    const decision = await prisma.decision.findUniqueOrThrow({
      where: { assignmentId: req.params.assignmentId },
    })
    res.json({ decision })
  } catch (err) {
    next(err)
  }
})

export default router
