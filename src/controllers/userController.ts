import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../connection/db.js';
import { registerSchema, loginSchema } from '../schema/index.js';
import { signToken, invalidateToken } from '../utils/jwt.js';

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const { name, email, password, heightCm, weightKg, place, bio } = parsed.data;
    const normEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        name,
        email: normEmail,
        password: passwordHash,
        heightCm: typeof heightCm === 'number' ? heightCm : undefined,
        weightKg: typeof weightKg === 'number' ? weightKg : undefined,
        place: place ?? undefined,
        bio: bio ?? undefined,
      } as any,
    });

    const user = { id: createdUser.id, name: createdUser.name, email: createdUser.email, role: (createdUser as any).role };

    const token = signToken({ id: user.id, name: user.name, role: (user as any).role });

    return res.status(201).json({ message: 'Registered successfully', user, token });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Many-to-many trainer management
export const listUserTrainers = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string } | undefined
    if (!auth?.id) return res.status(401).json({ message: 'Unauthorized' })

    const rows = await (prisma as any).userTrainer.findMany({
      where: { userId: auth.id },
      include: { trainer: true },
      orderBy: { createdAt: 'desc' },
    })
    const trainers = rows.map((r: any) => ({
      id: r.trainer.id,
      name: r.trainer.name,
      qualification: r.trainer.qualification,
      imageUrl: r.trainer.imageUrl,
      championDetails: r.trainer.championDetails,
    }))
    return res.status(200).json({ trainers })
  } catch (err) {
    console.error('listUserTrainers error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const addUserTrainer = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string } | undefined
    if (!auth?.id) return res.status(401).json({ message: 'Unauthorized' })
    const { trainerId } = req.body as { trainerId?: string }
    if (!trainerId) return res.status(400).json({ message: 'trainerId is required' })

    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } })
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' })

    const dbUser = await prisma.user.findUnique({ where: { id: auth.id } })
    // Enforce active membership plan before allowing trainer selection
    // Consider the plan active based on end date only, to support plans without enum label
    const planEndsAt = (dbUser as any)?.planEndsAt as Date | string | null | undefined
    const now = new Date()
    const active = planEndsAt && new Date(planEndsAt) > now
    if (!active) {
      return res.status(403).json({ message: 'An active membership plan is required to select trainers.' })
    }

    const limit = (dbUser as any)?.trainersLimit as number | null | undefined
    if (typeof limit !== 'number' || limit <= 0) {
      return res.status(403).json({ message: 'Your plan does not allow selecting trainers. Please upgrade your membership.' })
    }
    const currentCount = await (prisma as any).userTrainer.count({ where: { userId: auth.id } })
    if (typeof limit === 'number' && limit >= 0 && currentCount >= limit) {
      return res.status(403).json({ message: `You can select up to ${limit} trainer(s).` })
    }

    await (prisma as any).userTrainer.upsert({
      where: { userId_trainerId: { userId: auth.id, trainerId } },
      update: {},
      create: { userId: auth.id, trainerId },
    })
    return res.status(200).json({ message: 'Trainer added' })
  } catch (err) {
    console.error('addUserTrainer error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const removeUserTrainer = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user as { id: string } | undefined
    if (!auth?.id) return res.status(401).json({ message: 'Unauthorized' })
    const { trainerId } = req.body as { trainerId?: string }
    if (!trainerId) return res.status(400).json({ message: 'trainerId is required' })

    await (prisma as any).userTrainer.delete({
      where: { userId_trainerId: { userId: auth.id, trainerId } },
    })
    return res.status(200).json({ message: 'Trainer removed' })
  } catch (err) {
    console.error('removeUserTrainer error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;
    const normEmail = email.trim().toLowerCase();

    // Use case-insensitive match to support legacy mixed-case emails
    const user = await prisma.user.findFirst({ where: { email: { equals: normEmail, mode: 'insensitive' } } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, (user as any).password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, name: user.name, role: (user as any).role });
    return res.status(200).json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: (user as any).role } });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const selectTrainer = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as { id: string };
    const { trainerId, replace } = req.body as { trainerId?: string; replace?: boolean };

    if (!trainerId) {
      return res.status(400).json({ message: 'Trainer ID is required' });
    }

    // Ensure trainer exists
    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });

    const current = await prisma.user.findUnique({ where: { id: user.id } });
    // Enforce active membership plan here as well for legacy single-trainer path
    const planEndsAt = (current as any)?.planEndsAt as Date | string | null | undefined
    const now = new Date()
    const active = planEndsAt && new Date(planEndsAt) > now
    if (!active) {
      return res.status(403).json({ message: 'An active membership plan is required to select a trainer.' })
    }
    const limit = (current as any)?.trainersLimit as number | null | undefined
    if (typeof limit !== 'number' || limit <= 0) {
      return res.status(403).json({ message: 'Your plan does not allow selecting trainers. Please upgrade your membership.' })
    }
    const currentTrainerId = (current as any)?.trainerId as string | undefined;

    if (currentTrainerId && currentTrainerId !== trainerId) {
      if (!replace) {
        return res.status(409).json({ message: 'You have already selected a trainer. To change, pass replace=true.' });
      }
    }

    if (currentTrainerId === trainerId) {
      return res.status(200).json({ message: 'Trainer already selected' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { trainerId } });

    return res.status(200).json({ message: 'Trainer selected successfully' });
  } catch (err) {
    console.error('Select trainer error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const dashboard = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user as { id: string; name: string } | undefined;
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { trainer: true },
    });
    let trainersList: any[] = []
    try {
      const links = await (prisma as any).userTrainer.findMany({ where: { userId: currentUser.id }, include: { trainer: true } })
      trainersList = Array.isArray(links)
        ? links.map((ut: any) => ({
            id: ut.trainer.id,
            name: ut.trainer.name,
            qualification: ut.trainer.qualification,
            imageUrl: ut.trainer.imageUrl,
            championDetails: ut.trainer.championDetails,
          }))
        : []
    } catch {}
    const user = dbUser
      ? {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: (dbUser as any).role,
          heightCm: (dbUser as any).heightCm,
          weightKg: (dbUser as any).weightKg,
          place: (dbUser as any).place,
          bio: (dbUser as any).bio,
          createdAt: (dbUser as any).createdAt,
          // membership fields
          membershipPlan: (dbUser as any).membershipPlan ?? null,
          planStartsAt: (dbUser as any).planStartsAt ?? null,
          planEndsAt: (dbUser as any).planEndsAt ?? null,
          trainersLimit: (dbUser as any).trainersLimit ?? null,
          freeProductsPerMonth: (dbUser as any).freeProductsPerMonth ?? null,
          // expose legacy single trainer AND list of trainers
          trainer: (dbUser as any).trainer
            ? {
                id: ((dbUser as any).trainer as any).id,
                name: ((dbUser as any).trainer as any).name,
                qualification: ((dbUser as any).trainer as any).qualification,
                imageUrl: ((dbUser as any).trainer as any).imageUrl,
                championDetails: ((dbUser as any).trainer as any).championDetails,
              }
            : null,
          trainers: trainersList,
        }
      : null;

    return res.status(200).json({ message: `Welcome ${currentUser.name}`, user });
  } catch (err) {
    console.error('Dashboard error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = (req as any).token as string | undefined;
    if (token) invalidateToken(token);
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

