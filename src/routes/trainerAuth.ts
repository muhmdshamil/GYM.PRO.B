import { Router } from 'express';
import { trainerLogin } from '../controllers/trainerAuthController.js';

const router = Router();

router.post('/login', trainerLogin);

export default router;
