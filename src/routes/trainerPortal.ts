import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { trainerOnly } from '../middleware/trainer.js';
import { listAssignedUsers, deleteAssignedUser, sendUserPlanEmail } from '../controllers/trainerPortalController.js';

const router = Router();

router.get('/users', authMiddleware, trainerOnly, listAssignedUsers);
router.delete('/users/:userId', authMiddleware, trainerOnly, deleteAssignedUser);
router.post('/users/:userId/plan', authMiddleware, trainerOnly, sendUserPlanEmail);

export default router;
