import { Router } from 'express'
import { createContactMessage, listContactMessages } from '../controllers/contactController.js'
import { ownerOnly } from '../middleware/owner.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// Public endpoint to submit a message
router.post('/', createContactMessage)

// Owner-only to list messages (must be authed first)
router.get('/', authMiddleware, ownerOnly, listContactMessages)

export default router
