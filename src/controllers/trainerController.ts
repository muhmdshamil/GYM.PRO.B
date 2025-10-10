import { Request, Response } from 'express';
import { prisma } from '../connection/db.js';
import { trainerCreateSchema, trainerUpdateSchema } from '../schema/index.js';
import bcrypt from 'bcryptjs';

export const listTrainers = async (_req: Request, res: Response) => {
  try {
    const trainers = await prisma.trainer.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        qualification: true,
        imageUrl: true,
        championDetails: true,
        createdAt: true,
      },
    });
    return res.status(200).json({ trainers });
  } catch (err) {
    console.error('List trainers error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTrainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trainer = await prisma.trainer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        qualification: true,
        imageUrl: true,
        championDetails: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    return res.status(200).json({ trainer });
  } catch (err) {
    console.error('Get trainer error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTrainer = async (req: Request, res: Response) => {
  try {
    const parsed = trainerCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const { name, qualification, imageUrl, championDetails, email, password } = parsed.data as any;

    if (email) {
      const existing = await prisma.trainer.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Trainer email already in use' });
    }

    const created = await prisma.trainer.create({
      data: {
        name,
        qualification,
        imageUrl: imageUrl ?? null,
        championDetails: championDetails ?? null,
        email: email ?? null,
        password: password ? await bcrypt.hash(password, 10) : null,
      },
      select: { id: true, name: true, qualification: true, imageUrl: true, championDetails: true, createdAt: true },
    });
    return res.status(201).json({ message: 'Trainer created', trainer: created });
  } catch (err) {
    console.error('Create trainer error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTrainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = trainerUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const data = parsed.data;

    const existing = await prisma.trainer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Trainer not found' });

    const updated = await prisma.trainer.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.qualification !== undefined ? { qualification: data.qualification } : {}),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
        ...(data.championDetails !== undefined ? { championDetails: data.championDetails } : {}),
      },
      select: { id: true, name: true, qualification: true, imageUrl: true, championDetails: true, updatedAt: true },
    });
    return res.status(200).json({ message: 'Trainer updated', trainer: updated });
  } catch (err) {
    console.error('Update trainer error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTrainer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.trainer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Trainer not found' });

    await prisma.trainer.delete({ where: { id } });
    return res.status(200).json({ message: 'Trainer deleted' });
  } catch (err) {
    console.error('Delete trainer error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
