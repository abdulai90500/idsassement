import express from 'express'
import { PrismaClient } from '@prisma/client'
import studiesRouter from './routes/studies.js'
import assignmentsRouter from './routes/assignments.js'
import decisionsRouter from './routes/decisions.js'
import conflictsRouter from './routes/conflicts.js'
import exportRouter from './routes/export.js'
import { errorHandler } from './middleware/errorHandler.js'

export const prisma = new PrismaClient()

const app = express()
app.use(express.json())

// ── Routes ──────────────────────────────────────
app.use('/studies',     studiesRouter)
app.use('/assignments', assignmentsRouter)
app.use('/decisions',   decisionsRouter)
app.use('/conflicts',   conflictsRouter)
app.use('/export',      exportRouter)

// ── Health check ────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Error handler (must be last) ────────────────
app.use(errorHandler)

// ── Start ────────────────────────────────────────
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Sabi Core Screening API listening on http://localhost:${PORT}`)
})

export default app
