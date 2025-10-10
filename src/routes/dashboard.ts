import { Router } from 'express';
import { dashboard } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { ownerOnly } from '../middleware/owner.js';
import { getOwnerStats } from '../controllers/ownerController.js';

const router = Router();

router.get('/', authMiddleware, dashboard);
router.get('/owner/stats', authMiddleware, ownerOnly, getOwnerStats);

export default router;
