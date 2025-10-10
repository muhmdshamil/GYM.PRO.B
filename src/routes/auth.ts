import { Router } from 'express';
import { register, login, logout } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

export default router;
