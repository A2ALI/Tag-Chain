-- Tag Chain Stage 3 Rollback Function
-- Date: 2025-10-26

-- Create rollback function for Stage 3
CREATE OR REPLACE FUNCTION rollback_stage3()
RETURNS text AS $$
BEGIN
  -- Archive before drop
  CREATE TABLE IF NOT EXISTS backup_escrow_logs AS TABLE escrow_logs;
  CREATE TABLE IF NOT EXISTS backup_webhook_logs AS TABLE webhook_logs;
  
  -- Drop tables
  DROP TABLE IF EXISTS escrow_logs, webhook_logs;
  
  -- Drop columns
  ALTER TABLE transactions DROP COLUMN IF EXISTS hcs_tx_id;
  ALTER TABLE certificates DROP COLUMN IF EXISTS hcs_tx_id;
  
  -- Drop indexes
  DROP INDEX IF EXISTS idx_transactions_escrow_status;
  DROP INDEX IF EXISTS idx_escrow_logs_topic_id;
  DROP INDEX IF EXISTS idx_escrow_logs_transaction_id;
  
  RETURN 'Stage 3 rollback completed successfully';
END;
$$ LANGUAGE plpgsql;

-- ROLLBACK (to reapply Stage 3 changes):
/*
-- Recreate tables
CREATE TABLE IF NOT EXISTS escrow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  message TEXT,
  topic_id TEXT,
  hcs_tx_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  event_type TEXT,
  raw_payload jsonb,
  received_at TIMESTAMP DEFAULT NOW()
);

-- Add columns back
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS hcs_tx_id TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS hcs_tx_id TEXT;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transactions_escrow_status ON transactions(escrow_status);
CREATE INDEX IF NOT EXISTS idx_escrow_logs_topic_id ON escrow_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_escrow_logs_transaction_id ON escrow_logs(transaction_id);
*/