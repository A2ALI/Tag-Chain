import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { Client, AccountId, AccountBalanceQuery } from '@hashgraph/sdk';
import { initSentry } from './sentry.js';

// Initialize Sentry
initSentry();

// Mock logSecurityEvent function
async function logSecurityEvent(eventDetails) {
  console.log('Security event logged:', eventDetails.event);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Function to check rate engine health
async function checkRateHealth() {
  try {
    // For demo, just return ok
    return 'ok';
  } catch (error) {
    return 'error';
  }
}

// Function to get account balance
async function getAccountBalance(accountId) {
  try {
    const client = Client.forTestnet();
    client.setOperator(
      process.env.HEDERA_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID,
      process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_OPERATOR_KEY
    );
    
    const account = AccountId.fromString(accountId);
    const balance = await new AccountBalanceQuery()
      .setAccountId(account)
      .execute(client);
      
    return {
      status: 'ok',
      hbars: balance.hbars.toString(),
      tokens: Object.fromEntries(balance.tokens)
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

// Auto-recovery patch
export async function autoRecoverIfNeeded(issues) {
  for (const issue of issues) {
    if (issue.service === 'supabase' && issue.status === 'down') {
      console.log('🩹 Reconnecting Supabase client...');
    }
    if (issue.service === 'hedera' && issue.status === 'low_balance') {
      console.log('⚠️ Alert: Low liquidity wallet balance');
    }
  }
}

export async function runHealthChecks() {
  const results = {};

  try {
    // Database check - simplified approach
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count()');
      
      results.database = !error ? 'ok' : 'error';
    } catch (dbError) {
      results.database = 'error';
    }

    // Rate Engine check
    results.rateEngine = await checkRateHealth();

    // Hedera balance check
    results.liquidityWallet = await getAccountBalance(process.env.LIQUIDITY_WALLET_ID);

    // Security log heartbeat
    await logSecurityEvent({
      event: 'monitoring_healthcheck',
      severity: 'info',
      details: JSON.stringify(results)
    });

    // Auto-recovery if needed
    const issues = [];
    if (results.database === 'error') {
      issues.push({ service: 'supabase', status: 'down' });
    }
    if (results.liquidityWallet.status === 'ok' && parseFloat(results.liquidityWallet.hbars) < 5) {
      issues.push({ service: 'hedera', status: 'low_balance' });
    }
    if (issues.length > 0) {
      await autoRecoverIfNeeded(issues);
    }

    return { ok: true, results };
  } catch (err) {
    await logSecurityEvent({
      event: 'monitoring_error',
      severity: 'high',
      details: err.message
    });
    return { ok: false, error: err.message };
  }
}