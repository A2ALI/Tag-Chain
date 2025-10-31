-- Tag Chain PRD4 Phase C Step 3: On/Off-Ramp Integration
-- Date: 2025-10-29

-- Create onchain_inbound_events table
CREATE TABLE IF NOT EXISTS onchain_inbound_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT,
  amount DECIMAL,
  token TEXT,
  tx_hash TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create onchain_withdrawals table
CREATE TABLE IF NOT EXISTS onchain_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL,
  token TEXT,
  to_address TEXT,
  status TEXT,
  tx_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create liquidity_rates table
CREATE TABLE IF NOT EXISTS liquidity_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT,
  quote_currency TEXT,
  source TEXT,
  rate DECIMAL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Create liquidity_rate_history table
CREATE TABLE IF NOT EXISTS liquidity_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base TEXT,
  quote TEXT,
  source TEXT,
  rate DECIMAL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Create fiat_payouts table
CREATE TABLE IF NOT EXISTS fiat_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount_local DECIMAL,
  currency TEXT,
  flw_transfer_id TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inbound_tx_hash ON onchain_inbound_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_withdrawals_tx_hash ON onchain_withdrawals(tx_hash);
CREATE INDEX IF NOT EXISTS idx_rates_fetched_at ON liquidity_rates(fetched_at);

-- ROLLBACK (manual only)
-- DROP INDEX IF EXISTS idx_inbound_tx_hash;
-- DROP INDEX IF EXISTS idx_withdrawals_tx_hash;
-- DROP INDEX IF EXISTS idx_rates_fetched_at;
-- DROP TABLE IF EXISTS fiat_payouts;
-- DROP TABLE IF EXISTS liquidity_rate_history;
-- DROP TABLE IF EXISTS liquidity_rates;
-- DROP TABLE IF EXISTS onchain_withdrawals;
-- DROP TABLE IF EXISTS onchain_inbound_events;