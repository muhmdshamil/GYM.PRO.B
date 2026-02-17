import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../connection/db.js';
import { Role } from '@prisma/client';

export const listOwners = async (_req: Request, res: Response) => {
  try {
    const owners = await prisma.user.findMany({
      where: { role: Role.OWNER },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ owners });
  } catch (err) {
    console.error('listOwners error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createOwner = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const normEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name,
        email: normEmail,
        password: passwordHash,
        role: Role.OWNER,
      } as any,
    });

    return res.status(201).json({
      message: 'Owner created',
      owner: { id: created.id, name: created.name, email: created.email },
    });
  } catch (err) {
    console.error('createOwner error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAdminProfile = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string } | undefined;
    if (!auth?.id) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: auth.id } });
    if (!user) return res.status(404).json({ message: 'Admin not found' });

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: (user as any).role,
    });
  } catch (err) {
    console.error('getAdminProfile error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateAdminProfile = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string } | undefined;
    if (!auth?.id) return res.status(401).json({ message: 'Unauthorized' });

    const { name, email } = req.body as { name?: string; email?: string };

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email.trim().toLowerCase();

    const updated = await prisma.user.update({ where: { id: auth.id }, data });

    return res.status(200).json({
      message: 'Profile updated',
      admin: { id: updated.id, name: updated.name, email: updated.email },
    });
  } catch (err) {
    console.error('updateAdminProfile error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
