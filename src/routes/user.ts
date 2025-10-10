import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { selectTrainer, listUserTrainers, addUserTrainer, removeUserTrainer } from '../controllers/userController.js';

const router = Router();

router.post('/select-trainer', authMiddleware, selectTrainer);

// Many-to-many trainer management
router.get('/trainers', authMiddleware, listUserTrainers);
router.post('/trainers/add', authMiddleware, addUserTrainer);
router.post('/trainers/remove', authMiddleware, removeUserTrainer);

export default router;
