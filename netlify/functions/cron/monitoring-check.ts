import { Handler } from '@netlify/functions'
import { runHealthChecks } from '../../../src/lib/healthMonitor'
import { sendAlert } from '../../../src/lib/alertService'

export const handler: Handler = async (event, context) => {
  const result = await runHealthChecks()
  if (!result.ok) {
    await sendAlert('🚨 Monitoring Failure', JSON.stringify(result.error))
    return { statusCode: 500, body: JSON.stringify(result) }
  }
  return { statusCode: 200, body: JSON.stringify(result) }
}