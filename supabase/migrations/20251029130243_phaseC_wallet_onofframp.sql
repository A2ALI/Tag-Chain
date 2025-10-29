-- Tag Chain PRD4 Phase C: Wallet Connect + On/Off-Ramp + Security
-- Date: 2025-10-29

-- Add wallet-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onchain_id TEXT UNIQUE;

-- Extend security_events with new columns
ALTER TABLE security_events 
  ADD COLUMN IF NOT EXISTS severity TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_onchain_id ON users(onchain_id);
CREATE INDEX IF NOT EXISTS idx_security_events_tx_hash ON security_events(tx_hash);
CREATE INDEX IF NOT EXISTS idx_security_events_wallet_address ON security_events(wallet_address);

-- ROLLBACK (manual only)
-- DROP INDEX IF EXISTS idx_users_onchain_id;
-- DROP INDEX IF EXISTS idx_security_events_tx_hash;
-- DROP INDEX IF EXISTS idx_security_events_wallet_address;
-- ALTER TABLE users DROP COLUMN IF EXISTS wallet_type;
-- ALTER TABLE users DROP COLUMN IF EXISTS onchain_id;
-- ALTER TABLE security_events DROP COLUMN IF EXISTS severity;
-- ALTER TABLE security_events DROP COLUMN IF EXISTS tx_hash;
-- ALTER TABLE security_events DROP COLUMN IF EXISTS wallet_address;