import { runHealthChecks } from './healthMonitor'

async function testHealthMonitor() {
  console.log('Running health checks...')
  const result = await runHealthChecks()
  console.log('Health check result:', JSON.stringify(result, null, 2))
}

testHealthMonitor()