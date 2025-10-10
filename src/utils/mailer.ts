import nodemailer from 'nodemailer'

export interface MailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  attachments?: { filename: string; content: Buffer; contentType?: string }[]
}

// Support both SMTP_* (preferred) and EMAIL_* (fallback) env vars. Default to Gmail SSL if not provided.
const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com'
const port = process.env.SMTP_PORT
  ? Number(process.env.SMTP_PORT)
  : (process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 465)
const user = process.env.SMTP_USER || process.env.EMAIL_USER
const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
const from = process.env.MAIL_FROM || process.env.EMAIL_FROM || user

if (!host || !port || !user || !pass) {
  // We don't throw here so app can boot, but calls will fail clearly
  console.warn('[mailer] SMTP env vars missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM (or EMAIL_USER/EMAIL_PASSWORD, EMAIL_HOST/EMAIL_PORT, EMAIL_FROM)')
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for 465, false for others (STARTTLS)
  auth: { user, pass },
})

export async function sendMail(opts: MailOptions) {
  if (!host || !port || !user || !pass) {
    throw new Error('SMTP not configured. Set SMTP_HOST/PORT/USER/PASS (or EMAIL_HOST/PORT/USER/PASSWORD).')
  }
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  })
}
