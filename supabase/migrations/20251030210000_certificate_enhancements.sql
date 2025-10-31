-- Tag Chain Certificate Enhancements
-- Date: 2025-10-30

-- Drop the old certificates table and create the enhanced version
DROP TABLE IF EXISTS certificates;

-- Create enhanced certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('VET_HEALTH', 'EXPORT', 'HALAL', 'OTHER')),
  issuer_role TEXT NOT NULL CHECK (issuer_role IN ('VET', 'REGULATOR')),
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  issuer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signature_hash TEXT, -- HCS proof hash
  document_url TEXT, -- Optional upload
  on_chain_tx_id TEXT, -- Hedera transaction ID
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_certificates_animal ON certificates(animal_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issuer ON certificates(issuer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_role ON certificates(issuer_role);
CREATE INDEX IF NOT EXISTS idx_certificates_issued ON certificates(issued_at);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Vets can only insert where issuer_role='VET'
DROP POLICY IF EXISTS "Vets can insert vet certificates" ON certificates;
CREATE POLICY "Vets can insert vet certificates" ON certificates
    FOR INSERT WITH CHECK (
        issuer_role = 'VET' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'vet'
        )
    );

-- Regulators can insert where issuer_role='REGULATOR'
DROP POLICY IF EXISTS "Regulators can insert regulator certificates" ON certificates;
CREATE POLICY "Regulators can insert regulator certificates" ON certificates
    FOR INSERT WITH CHECK (
        issuer_role = 'REGULATOR' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'regulator'
        )
    );

-- Vets can view their own issued certificates
DROP POLICY IF EXISTS "Vets can view their certificates" ON certificates;
CREATE POLICY "Vets can view their certificates" ON certificates
    FOR SELECT USING (
        issuer_id = auth.uid() AND
        issuer_role = 'VET'
    );

-- Regulators can view their own issued certificates
DROP POLICY IF EXISTS "Regulators can view their certificates" ON certificates;
CREATE POLICY "Regulators can view their certificates" ON certificates
    FOR SELECT USING (
        issuer_id = auth.uid() AND
        issuer_role = 'REGULATOR'
    );

-- Farmers can view certificates for their animals
DROP POLICY IF EXISTS "Farmers can view certificates for their animals" ON certificates;
CREATE POLICY "Farmers can view certificates for their animals" ON certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE animals.id = certificates.animal_id 
            AND animals.farm_id IN (
                SELECT id FROM farms WHERE owner_id = auth.uid()
            )
        )
    );

-- Regulators can view all certificates (for oversight)
DROP POLICY IF EXISTS "Regulators can view all certificates" ON certificates;
CREATE POLICY "Regulators can view all certificates" ON certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'regulator'
        )
    );