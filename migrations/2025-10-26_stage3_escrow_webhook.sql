-- Tag Chain Stage 3 Escrow & Webhook Schema Migration
-- Date: 2025-10-26

-- Ensure escrow_logs table exists with correct schema
CREATE TABLE IF NOT EXISTS escrow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  message TEXT,
  topic_id TEXT,
  hcs_tx_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure webhook_logs table exists
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  event_type TEXT,
  raw_payload jsonb,
  received_at TIMESTAMP DEFAULT NOW()
);

-- Add hcs_tx_id column to transactions table if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS hcs_tx_id TEXT;

-- Add hcs_tx_id column to certificates table if not exists (already exists, but ensuring)
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS hcs_tx_id TEXT;

-- Add indexes where appropriate
CREATE INDEX IF NOT EXISTS idx_transactions_escrow_status ON transactions(escrow_status);
CREATE INDEX IF NOT EXISTS idx_escrow_logs_topic_id ON escrow_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_escrow_logs_transaction_id ON escrow_logs(transaction_id);

-- ROLLBACK SQL (commented out for safety):
/*
DROP INDEX IF EXISTS idx_transactions_escrow_status;
DROP INDEX IF EXISTS idx_escrow_logs_topic_id;
DROP INDEX IF EXISTS idx_escrow_logs_transaction_id;
ALTER TABLE certificates DROP COLUMN IF EXISTS hcs_tx_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS hcs_tx_id;
DROP TABLE IF EXISTS webhook_logs;
DROP TABLE IF EXISTS escrow_logs;
*/