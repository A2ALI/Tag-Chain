-- Tag Chain PRD4 Phase C Step 3: Fix on/off-ramp tables structure
-- Date: 2025-10-29

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_inbound_tx_hash;
DROP INDEX IF EXISTS idx_withdrawals_tx_hash;
DROP INDEX IF EXISTS idx_rates_fetched_at;

-- Add all missing columns to onchain_inbound_events table
ALTER TABLE onchain_inbound_events 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS amount DECIMAL,
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Add all missing columns to onchain_withdrawals table
ALTER TABLE onchain_withdrawals 
ADD COLUMN IF NOT EXISTS amount DECIMAL,
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS to_address TEXT,
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Create liquidity_rates table (if not exists)
CREATE TABLE IF NOT EXISTS liquidity_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT,
  quote_currency TEXT,
  source TEXT,
  rate DECIMAL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Create liquidity_rate_history table (if not exists)
CREATE TABLE IF NOT EXISTS liquidity_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base TEXT,
  quote TEXT,
  source TEXT,
  rate DECIMAL,
  fetched_at TIMESTAMP DEFAULT NOW()
);

-- Create fiat_payouts table (if not exists)
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
-- ALTER TABLE onchain_inbound_events DROP COLUMN IF EXISTS type, DROP COLUMN IF EXISTS amount, DROP COLUMN IF EXISTS token, DROP COLUMN IF EXISTS tx_hash, DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS created_at;
-- ALTER TABLE onchain_withdrawals DROP COLUMN IF EXISTS amount, DROP COLUMN IF EXISTS token, DROP COLUMN IF EXISTS to_address, DROP COLUMN IF EXISTS status, DROP COLUMN IF EXISTS tx_hash, DROP COLUMN IF EXISTS created_at;
-- DROP TABLE IF EXISTS fiat_payouts;
-- DROP TABLE IF EXISTS liquidity_rate_history;
-- DROP TABLE IF EXISTS liquidity_rates;