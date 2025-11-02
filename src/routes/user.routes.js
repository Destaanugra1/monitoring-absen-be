const { Router } = require('express')
const { getAllUsers } = require('../controllers/user.controller')
const { requirePanitia } = require('../middlewares/auth')

const router = Router()

// Only Panitia can list all users
router.get('/', requirePanitia(), getAllUsers)

module.exports = router
