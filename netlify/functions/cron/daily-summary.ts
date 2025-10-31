import { sendAlert } from '../../../src/lib/alertDispatcher';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const handler = async () => {
  try {
    const { data, error } = await supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    const summary = data.map(ev => `• [${ev.severity}] ${ev.event_type} – ${ev.details}`).join('\n');
    await sendAlert('🧾 Daily TagChain Summary', summary || 'No new events today.');
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    Sentry.captureException(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};