-- Tag Chain Core Tables Migration
-- Date: 2025-10-29

-- Create minimal placeholder tables for compatibility

-- USERS table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  name TEXT, 
  email TEXT UNIQUE, 
  role TEXT, 
  created_at TIMESTAMP DEFAULT NOW()
);

-- FARMS table
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  name TEXT, 
  location TEXT, 
  owner_id UUID REFERENCES users(id)
);

-- ANIMALS table
CREATE TABLE IF NOT EXISTS animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  tag_id TEXT UNIQUE, 
  breed TEXT, 
  age INT, 
  farm_id UUID REFERENCES farms(id)
);

-- TRANSACTIONS table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  animal_id UUID REFERENCES animals(id),
  amount NUMERIC,
  currency TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CERTIFICATES table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID REFERENCES animals(id),
  issuer_id UUID REFERENCES users(id),
  certificate_type TEXT,
  certificate_hash TEXT,
  issued_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_animals_farm ON animals(farm_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_certificates_animal ON certificates(animal_id);