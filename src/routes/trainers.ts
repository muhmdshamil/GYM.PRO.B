import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listTrainers, getTrainer, createTrainer, updateTrainer, deleteTrainer } from '../controllers/trainerController.js';
import { ownerOnly } from '../middleware/owner.js';

const router = Router();

// Public: list and get trainers (so users can browse)
router.get('/', listTrainers);
router.get('/:id', getTrainer);

// Protected: create/update/delete (shop owner/admin)
router.post('/', authMiddleware, ownerOnly, createTrainer);
router.put('/:id', authMiddleware, ownerOnly, updateTrainer);
router.delete('/:id', authMiddleware, ownerOnly, deleteTrainer);

export default router;
