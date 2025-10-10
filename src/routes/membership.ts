import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { ownerOnly } from '../middleware/owner.js';
import { subscribePlan, listPlans, subscribeByPlanId, createPlan, updatePlan, deletePlan } from '../controllers/membershipController.js';

const router = Router();

// Plans catalog (public)
router.get('/plans', listPlans);

// Subscribe using enum (backward compatible)
router.post('/subscribe', authMiddleware, subscribePlan);

// Subscribe using plan id from Plan table
router.post('/subscribe/:id', authMiddleware, subscribeByPlanId);

// Owner Plan CRUD
router.post('/plans', authMiddleware, ownerOnly, createPlan);
router.put('/plans/:id', authMiddleware, ownerOnly, updatePlan);
router.delete('/plans/:id', authMiddleware, ownerOnly, deletePlan);

export default router;
