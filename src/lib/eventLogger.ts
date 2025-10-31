import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function logEvent(type:string, data:any) {
  try {
    await supabase.from('security_events').insert([{ type, data, created_at: new Date() }])
    console.log('🧾 Event logged:', type)
  } catch (error:any) {
    console.error('Event log failed', error.message)
    Sentry.captureException(error)
  }
}