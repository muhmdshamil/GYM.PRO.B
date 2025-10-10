import { Request, Response } from 'express';
import { prisma } from '../connection/db.js';
import { generatePlanPDF } from '../services/plan.js';
import { sendMail } from '../utils/mailer.js';

export const listAssignedUsers = async (req: Request, res: Response) => {
  try {
    const trainer = (req as any).user as { id: string } | undefined;
    if (!trainer?.id) return res.status(401).json({ message: 'Unauthorized' });

    // Many-to-many: read via join table userTrainer
    const links = await (prisma as any).userTrainer.findMany({
      where: { trainerId: trainer.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            heightCm: true,
            weightKg: true,
            place: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const users = links.map((l: any) => l.user)
    return res.status(200).json({ users });
  } catch (err) {
    console.error('listAssignedUsers error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendUserPlanEmail = async (req: Request, res: Response) => {
  try {
    const trainer = (req as any).user as { id: string } | undefined;
    const { userId } = req.params as { userId: string };
    if (!trainer?.id) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, heightCm: true, weightKg: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const link = await (prisma as any).userTrainer.findUnique?.({
      where: { userId_trainerId: { userId, trainerId: trainer.id } },
    }) ?? await (prisma as any).userTrainer.findFirst({ where: { userId, trainerId: trainer.id } })
    if (!link) return res.status(403).json({ message: 'User not assigned to you' });

    if (!user.email) {
      return res.status(400).json({ message: 'User has no email configured' });
    }

    // Generate plan PDF
    const plan = await generatePlanPDF({
      name: user.name,
      email: user.email,
      heightCm: (user as any).heightCm ?? undefined,
      weightKg: (user as any).weightKg ?? undefined,
    });

    // Send email with attachment
    await sendMail({
      to: user.email,
      subject: 'Your 30-Day Workout & Nutrition Plan',
      text: `Hi ${user.name},\n\nAttached is your personalized 30-day plan. Plan type: ${plan.type.replace('_', ' ')}${plan.bmi ? ` (BMI: ${plan.bmi.toFixed(1)})` : ''}.\n\nAll the best!`,
      html: `<p>Hi ${user.name},</p><p>Attached is your personalized <strong>30-day plan</strong>.</p><p>Plan type: <strong>${plan.type.replace('_', ' ')}</strong>${plan.bmi ? ` (BMI: ${plan.bmi.toFixed(1)})` : ''}.</p><p>All the best!</p>`,
      attachments: [
        { filename: `plan-${user.name.replace(/\s+/g, '_').toLowerCase()}.pdf`, content: plan.pdfBuffer, contentType: 'application/pdf' },
      ],
    });

    return res.status(200).json({ message: 'Plan emailed successfully' });
  } catch (err) {
    console.error('sendUserPlanEmail error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteAssignedUser = async (req: Request, res: Response) => {
  try {
    const trainer = (req as any).user as { id: string } | undefined;
    const { userId } = req.params as { userId: string };
    if (!trainer?.id) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const link = await (prisma as any).userTrainer.findFirst({ where: { userId, trainerId: trainer.id } })
    if (!link) return res.status(403).json({ message: 'User not assigned to you' });

    // Remove dependent data first to satisfy FK constraints
    await prisma.$transaction(async (tx) => {
      // Remove the assignment link instead of deleting the user entirely
      await (tx as any).userTrainer.deleteMany({ where: { userId, trainerId: trainer.id } })
    });

    return res.status(200).json({ message: 'User unassigned' });
  } catch (err) {
    console.error('deleteAssignedUser error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
