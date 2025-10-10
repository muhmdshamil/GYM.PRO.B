import { Request, Response } from 'express'
import { prisma } from '../connection/db.js'

export const createContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, message } = req.body as { name?: string; email?: string; phone?: string; message?: string }
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' })
    }
    await (prisma as any).contactMessage.create({
      data: { name: name.trim(), email: email.trim(), phone: phone?.trim() || null, message: message.trim() },
    })
    return res.status(201).json({ message: 'Thanks! We will get back to you shortly.' })
  } catch (err) {
    console.error('createContactMessage error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const listContactMessages = async (_req: Request, res: Response) => {
  try {
    const messages = await (prisma as any).contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
    return res.status(200).json({ messages })
  } catch (err) {
    console.error('listContactMessages error', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
