import dotenv from 'dotenv';
dotenv.config();

import { sendAlert } from './alertDispatcher.js';

async function testAlert() {
  console.log('Testing alert dispatcher...');
  await sendAlert('Test Alert', 'This is a test alert from TagChain Phase D Step 3');
  console.log('Alert test completed');
}

testAlert();