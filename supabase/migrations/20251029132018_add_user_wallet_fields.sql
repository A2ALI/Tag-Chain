-- Add wallet-related columns to users table
-- Date: 2025-10-29

-- Add wallet_type and onchain_address columns to users table
-- onchain_id already exists from previous migration, but we'll ensure onchain_address is also available
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onchain_address TEXT UNIQUE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_onchain_address ON users(onchain_address);

-- ROLLBACK (manual only)
-- DROP INDEX IF EXISTS idx_users_onchain_address;
-- ALTER TABLE users DROP COLUMN IF EXISTS wallet_type;
-- ALTER TABLE users DROP COLUMN IF EXISTS onchain_address;