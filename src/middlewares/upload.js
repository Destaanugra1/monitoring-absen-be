// Lazy multer wrapper to avoid hard dependency at startup
function ensureMulter() {
  try {
    return require('multer')
  } catch (e) {
    const err = new Error('multer is required for file uploads. Please install it: npm i multer')
    err.status = 500
    throw err
  }
}

function uploadSingle(field, options = {}) {
  let handler = null
  return (req, res, next) => {
    if (!handler) {
      const multer = ensureMulter()
      const storage = multer.memoryStorage()
      handler = multer({ storage, limits: options.limits || { fileSize: 5 * 1024 * 1024 } }).single(field)
    }
    return handler(req, res, next)
  }
}

module.exports = { uploadSingle }
