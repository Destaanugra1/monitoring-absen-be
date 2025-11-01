function notFoundHandler(req, res, next) {
  res.status(404).json({ error: 'Route not found' })
}

function errorHandler(err, req, res, next) {
  console.error('[error]', err)
  const status = err?.status || 500
  const message = err?.message || 'Internal Server Error'
  res.status(status).json({ error: message })
}

module.exports = { notFoundHandler, errorHandler }
