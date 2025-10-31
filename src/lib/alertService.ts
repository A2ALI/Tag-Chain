import nodemailer from 'nodemailer'

export async function sendAlert(subject:string, message:string) {
  if(!process.env.SMTP_HOST) return console.warn('SMTP not configured.')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
  await transporter.sendMail({
    from: 'alerts@tagchain.app',
    to: process.env.MONITORING_ALERT_EMAIL || 'alerts@tagchain.app',
    subject,
    text: message
  })
  console.log('✅ Alert sent:', subject)
}