import dotenv from 'dotenv';
dotenv.config();

import { runHealthChecks } from './healthMonitor.js';

async function testHealthMonitor() {
  console.log('Running health checks...');
  const result = await runHealthChecks();
  console.log('Health check result:', JSON.stringify(result, null, 2));
}

testHealthMonitor();