import { createClient } from '@supabase/supabase-js'
import { logSecurityEvent } from './securityLogger'
import { rateEngine } from './rateEngine'
import { Client, AccountId, AccountBalanceQuery } from '@hashgraph/sdk'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Function to check rate engine health
async function checkRateHealth() {
  try {
    // Try to get a rate as a health check
    const rate = await rateEngine.getRate('TAGUSD', 'USD')
    return rate > 0 ? 'ok' : 'error'
  } catch (error) {
    return 'error'
  }
}

// Function to get account balance
async function getAccountBalance(accountId: string) {
  try {
    const client = Client.forTestnet()
    client.setOperator(
      process.env.HEDERA_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID!,
      process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_OPERATOR_KEY!
    )
    
    const account = AccountId.fromString(accountId)
    const balance = await new AccountBalanceQuery()
      .setAccountId(account)
      .execute(client)
      
    return {
      status: 'ok',
      hbars: balance.hbars.toString(),
      tokens: Object.fromEntries(balance.tokens)
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    }
  }
}

export async function runHealthChecks() {
  const results: any = {}

  try {
    // Database check - simplified approach since rpc might not be available
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count()')
      
      results.database = !error ? 'ok' : 'error'
    } catch (dbError) {
      results.database = 'error'
    }

    // Rate Engine check
    results.rateEngine = await checkRateHealth()

    // Hedera balance check
    results.liquidityWallet = await getAccountBalance(process.env.LIQUIDITY_WALLET_ID!)

    // Security log heartbeat
    await logSecurityEvent({
      event: 'monitoring_healthcheck',
      severity: 'info',
      details: JSON.stringify(results)
    })

    return { ok: true, results }
  } catch (err) {
    await logSecurityEvent({
      event: 'monitoring_error',
      severity: 'high',
      details: err.message
    })
    return { ok: false, error: err.message }
  }
}