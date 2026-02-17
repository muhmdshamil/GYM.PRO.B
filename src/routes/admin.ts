import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';
import { listOwners, createOwner, getAdminProfile, updateAdminProfile } from '../controllers/adminController.js';

const router = Router();

router.use(authMiddleware, adminOnly);

router.get('/owners', listOwners);
router.post('/owners', createOwner);

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

export default router;
