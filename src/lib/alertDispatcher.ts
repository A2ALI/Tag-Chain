import nodemailer from 'nodemailer';
import * as Sentry from '@sentry/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function sendAlert(subject: string, message: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: 'alerts@tagchain.app',
      to: process.env.MONITORING_ALERT_EMAIL,
      subject,
      text: message
    });
    await supabase.from('security_events').insert([{
      event_type: 'alert',
      details: message,
      severity: 'high',
      created_at: new Date().toISOString()
    }]);
  } catch (err) {
    Sentry.captureException(err);
  }
}