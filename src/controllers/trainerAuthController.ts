import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../connection/db.js';
import { signToken } from '../utils/jwt.js';
import { Role } from '@prisma/client';

export const trainerLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Look up in the trainer table
    const trainer = await prisma.trainer.findUnique({ where: { email } });
    if (!trainer || !trainer.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, trainer.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Trainer login should always issue a token with role 'TRAINER'
    const token = signToken({ id: trainer.id, name: trainer.name, role: Role.TRAINER });
    return res.status(200).json({ message: 'Login successful', token, trainer: { id: trainer.id, name: trainer.name, email: trainer.email } });
  } catch (err) {
    console.error('Trainer login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
