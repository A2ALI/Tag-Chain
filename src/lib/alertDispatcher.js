import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function sendAlert(subject, message) {
  try {
    if (!process.env.SMTP_HOST || !process.env.MONITORING_ALERT_EMAIL) {
      console.warn('SMTP not configured. Skipping alert.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      }
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
    
    console.log('✅ Alert sent:', subject);
  } catch (err) {
    console.error('Alert sending failed:', err.message);
  }
}