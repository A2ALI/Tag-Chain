-- Tag Chain PRD Schema Migration
-- Date: 2025-10-26

-- ensure uuid generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS (Supabase auth id)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  full_name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('farmer', 'buyer', 'vet', 'regulator', 'certifier', 'processor', 'distributor', 'retailer', 'admin')),
  phone TEXT,
  on_chain_id TEXT,             -- human-readable on-chain id (e.g., "TAGCHAIN:USER:uuid")
  wallet_address TEXT,          -- Hedera account id (0.0.x)
  country TEXT,
  currency TEXT,                -- default currency for display
  created_at TIMESTAMP DEFAULT NOW()
);

-- ANIMALS (numeric human tag)
CREATE TABLE IF NOT EXISTS animals (
  id BIGSERIAL PRIMARY KEY,
  animal_on_chain_id TEXT,      -- e.g., "TAGCHAIN:ANIMAL:<uuid>" or HCS message reference
  tag_number TEXT UNIQUE,
  qr_hash TEXT,                 -- QR target / hash to verify
  farmer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  breed TEXT,
  weight NUMERIC,
  age INTEGER,
  image_cid TEXT,               -- IPFS CID
  registered_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

-- TRANSACTIONS (escrow + marketplace)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES users(id),
  farmer_id uuid REFERENCES users(id),
  animal_id BIGINT REFERENCES animals(id),
  amount NUMERIC,
  currency TEXT DEFAULT 'USDC',
  escrow_tx TEXT,               -- escrow reference or external tx ref
  escrow_status TEXT DEFAULT 'pending', -- pending|funded|released|disputed|cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id BIGINT REFERENCES animals(id),
  vet_id uuid REFERENCES users(id),
  certifier_id uuid REFERENCES users(id),
  certificate_type TEXT,
  certificate_hash TEXT,
  hcs_tx_id TEXT,
  issued_at TIMESTAMP DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE
);

-- ESCROW_LOGS (audit log; references transactions.id uuid)
CREATE TABLE IF NOT EXISTS escrow_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  message TEXT,
  topic_id TEXT,
  hcs_tx_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WEBHOOK / AUDIT LOGGING (optional)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT,
  event_type TEXT,
  raw_payload jsonb,
  received_at TIMESTAMP DEFAULT NOW()
);

-- ALERTS
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  severity TEXT,
  description TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- USER_KEYS (secure storage for encrypted private keys)
CREATE TABLE IF NOT EXISTS user_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  encrypted_private_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HEDERA_TOPIC_CHECKS (verification of HCS topics)
CREATE TABLE IF NOT EXISTS hedera_topic_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  tx_id TEXT NOT NULL,
  consensus_timestamp TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist
-- For users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('farmer', 'buyer', 'vet', 'regulator', 'certifier', 'processor', 'distributor', 'retailer', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT;

-- For animals table (changing from UUID to BIGSERIAL as per PRD)
-- We'll need to recreate the table with the correct structure
-- First, let's check if the table has data
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM animals LIMIT 1) THEN
    -- If no data, drop and recreate with correct structure
    DROP TABLE IF EXISTS animals CASCADE;
    CREATE TABLE animals (
      id BIGSERIAL PRIMARY KEY,
      animal_on_chain_id TEXT,
      tag_number TEXT UNIQUE,
      qr_hash TEXT,
      farmer_id uuid REFERENCES users(id) ON DELETE SET NULL,
      breed TEXT,
      weight NUMERIC,
      age INTEGER,
      image_cid TEXT,
      registered_at TIMESTAMP DEFAULT NOW(),
      status TEXT DEFAULT 'active'
    );
  ELSE
    -- If data exists, we'll add the missing columns but keep the existing structure
    ALTER TABLE animals ADD COLUMN IF NOT EXISTS tag_number TEXT UNIQUE;
    ALTER TABLE animals ADD COLUMN IF NOT EXISTS qr_hash TEXT;
    ALTER TABLE animals ADD COLUMN IF NOT EXISTS farmer_id uuid REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE animals ADD COLUMN IF NOT EXISTS image_cid TEXT;
    ALTER TABLE animals ADD COLUMN IF NOT EXISTS registered_at TIMESTAMP DEFAULT NOW();
    ALTER TABLE animals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    -- Rename existing columns to match PRD if needed
    ALTER TABLE animals RENAME COLUMN tag_id TO tag_number;
    ALTER TABLE animals RENAME COLUMN owner_id TO farmer_id;
    ALTER TABLE animals RENAME COLUMN health_status TO status;
    ALTER TABLE animals RENAME COLUMN image_url TO image_cid;
  END IF;
END $$;

-- For certificates table
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS vet_id uuid REFERENCES users(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certifier_id uuid REFERENCES users(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS certificate_type TEXT;
ALTER TABLE certificates RENAME COLUMN cert_type TO certificate_type;
ALTER TABLE certificates RENAME COLUMN issued_by TO vet_id;
ALTER TABLE certificates RENAME COLUMN hash TO certificate_hash;

-- For transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS farmer_id uuid REFERENCES users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS escrow_tx TEXT;

-- For escrow_logs table
ALTER TABLE escrow_logs ADD COLUMN IF NOT EXISTS topic_id TEXT;
ALTER TABLE escrow_logs ADD COLUMN IF NOT EXISTS message TEXT;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedera_topic_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own data" ON users;
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (id = auth.uid());

-- Create policies for animals table
DROP POLICY IF EXISTS "Users can view all animals" ON animals;
CREATE POLICY "Users can view all animals" ON animals
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can create animals" ON animals;
CREATE POLICY "Farmers can create animals" ON animals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'farmer'
        )
    );

-- Create policies for certificates table
DROP POLICY IF EXISTS "Users can view all certificates" ON certificates;
CREATE POLICY "Users can view all certificates" ON certificates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Vets can create certificates" ON certificates;
CREATE POLICY "Vets can create certificates" ON certificates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'vet'
        )
    );

-- Create policies for transactions table
DROP POLICY IF EXISTS "Users can view their transactions" ON transactions;
CREATE POLICY "Users can view their transactions" ON transactions
    FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can create transactions" ON transactions;
CREATE POLICY "Authenticated users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for escrow_logs table
DROP POLICY IF EXISTS "Users can view escrow logs for their transactions" ON escrow_logs;
CREATE POLICY "Users can view escrow logs for their transactions" ON escrow_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transactions 
            WHERE transactions.id = escrow_logs.transaction_id 
            AND (transactions.buyer_id = auth.uid() OR transactions.seller_id = auth.uid())
        )
    );

-- Create policies for webhook_logs table
DROP POLICY IF EXISTS "Admins can view webhook logs" ON webhook_logs;
CREATE POLICY "Admins can view webhook logs" ON webhook_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for alerts table
DROP POLICY IF EXISTS "Users can view all alerts" ON alerts;
CREATE POLICY "Users can view all alerts" ON alerts
    FOR SELECT USING (true);

-- Create policies for user_keys table (only service role can access)
DROP POLICY IF EXISTS "Service role can manage user keys" ON user_keys;
CREATE POLICY "Service role can manage user keys" ON user_keys
    FOR ALL USING (true);

-- Create policies for hedera_topic_checks table
DROP POLICY IF EXISTS "Users can view topic checks" ON hedera_topic_checks;
CREATE POLICY "Users can view topic checks" ON hedera_topic_checks
    FOR SELECT USING (true);