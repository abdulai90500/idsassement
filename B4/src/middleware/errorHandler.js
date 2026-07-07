/**
 * Global error handler middleware.
 * Centralises error formatting so routes can just call next(err).
 */
export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal server error'

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict: a record with this unique key already exists.',
      fields: err.meta?.target,
    })
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: 'Validation failed',
      issues: err.errors,
    })
  }

  console.error('[ERROR]', err)
  res.status(status).json({ error: message })
}
