import { Request, Response } from 'express'
import { prisma } from '../connection/db.js'
import { Role } from '@prisma/client'

export const getOwnerStats = async (_req: Request, res: Response) => {
  try {
    const [totalUsers, totalTrainers, assignedUsers] = await Promise.all([
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.trainer.count(),
      prisma.user.count({ where: { role: Role.USER, trainerId: { not: null } } }),
    ])

    // You can extend with more KPIs later (e.g., users per trainer)
    return res.status(200).json({
      totalUsers,
      totalTrainers,
      assignedUsers,
    })
  } catch (err) {
    console.error('getOwnerStats error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
