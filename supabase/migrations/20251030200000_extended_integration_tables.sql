-- Tag Chain Extended Integration Tables
-- Date: 2025-10-30

-- Create vet_records table
CREATE TABLE IF NOT EXISTS vet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vet_id UUID REFERENCES users(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- vaccination, birth, treatment
  description TEXT,
  date DATE NOT NULL,
  signature_hash TEXT, -- HCS proof hash
  attachment_url TEXT, -- URL to uploaded certificate/PDF
  on_chain_hash TEXT, -- Hash stored on Hedera HCS
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create abattoirs table
CREATE TABLE IF NOT EXISTS abattoirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  license_number TEXT UNIQUE,
  is_licensed_export BOOLEAN DEFAULT FALSE,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create abattoir_sales table
CREATE TABLE IF NOT EXISTS abattoir_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abattoir_id UUID REFERENCES abattoirs(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
  product_type TEXT, -- beef_cuts, hides, offal, etc.
  weight NUMERIC,
  price NUMERIC,
  currency TEXT DEFAULT 'USDC',
  sale_date DATE,
  is_processed BOOLEAN DEFAULT FALSE,
  vet_certified BOOLEAN DEFAULT FALSE, -- Must be true before sale
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transports table
CREATE TABLE IF NOT EXISTS transports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id UUID, -- References escrow_logs.id
  transporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  animal_id UUID REFERENCES animals(id) ON DELETE SET NULL,
  pickup_location TEXT,
  delivery_location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_transit', 'delivered', 'cancelled')),
  scheduled_pickup TIMESTAMP,
  actual_pickup TIMESTAMP,
  actual_delivery TIMESTAMP,
  payment_tx TEXT, -- Hedera payment transaction hash
  on_chain_hash TEXT, -- Hash stored on Hedera HCS
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ews_disease_alerts table
CREATE TABLE IF NOT EXISTS ews_disease_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name TEXT NOT NULL,
  region TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  source TEXT, -- FAO, OpenWeather, etc.
  alert_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_vet_records_vet ON vet_records(vet_id);
CREATE INDEX IF NOT EXISTS idx_vet_records_animal ON vet_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_vet_records_date ON vet_records(date);
CREATE INDEX IF NOT EXISTS idx_abattoir_sales_abattoir ON abattoir_sales(abattoir_id);
CREATE INDEX IF NOT EXISTS idx_abattoir_sales_animal ON abattoir_sales(animal_id);
CREATE INDEX IF NOT EXISTS idx_abattoir_sales_date ON abattoir_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_transports_escrow ON transports(escrow_id);
CREATE INDEX IF NOT EXISTS idx_transports_transporter ON transports(transporter_id);
CREATE INDEX IF NOT EXISTS idx_transports_animal ON transports(animal_id);
CREATE INDEX IF NOT EXISTS idx_transports_status ON transports(status);
CREATE INDEX IF NOT EXISTS idx_ews_disease_alerts_region ON ews_disease_alerts(region);
CREATE INDEX IF NOT EXISTS idx_ews_disease_alerts_active ON ews_disease_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_ews_disease_alerts_severity ON ews_disease_alerts(severity);

-- Enable RLS
ALTER TABLE vet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE abattoirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE abattoir_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE transports ENABLE ROW LEVEL SECURITY;
ALTER TABLE ews_disease_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vet_records
-- Vets can view their own records
DROP POLICY IF EXISTS "Vets can view their records" ON vet_records;
CREATE POLICY "Vets can view their records" ON vet_records
    FOR SELECT USING (vet_id = auth.uid());

-- Vets can insert their own records
DROP POLICY IF EXISTS "Vets can insert their records" ON vet_records;
CREATE POLICY "Vets can insert their records" ON vet_records
    FOR INSERT WITH CHECK (vet_id = auth.uid());

-- Vets can update their own records
DROP POLICY IF EXISTS "Vets can update their records" ON vet_records;
CREATE POLICY "Vets can update their records" ON vet_records
    FOR UPDATE USING (vet_id = auth.uid());

-- Vets can delete their own records
DROP POLICY IF EXISTS "Vets can delete their records" ON vet_records;
CREATE POLICY "Vets can delete their records" ON vet_records
    FOR DELETE USING (vet_id = auth.uid());

-- Farmers and regulators can view vet records for their animals
DROP POLICY IF EXISTS "Farmers can view vet records for their animals" ON vet_records;
CREATE POLICY "Farmers can view vet records for their animals" ON vet_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE animals.id = vet_records.animal_id 
            AND animals.farm_id IN (
                SELECT id FROM farms WHERE owner_id = auth.uid()
            )
        )
    );

-- Create RLS policies for abattoirs
-- Anyone can view abattoirs
DROP POLICY IF EXISTS "Anyone can view abattoirs" ON abattoirs;
CREATE POLICY "Anyone can view abattoirs" ON abattoirs
    FOR SELECT USING (TRUE);

-- Regulators can manage abattoirs
DROP POLICY IF EXISTS "Regulators can manage abattoirs" ON abattoirs;
CREATE POLICY "Regulators can manage abattoirs" ON abattoirs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'regulator'
        )
    );

-- Create RLS policies for abattoir_sales
-- Anyone can view abattoir sales
DROP POLICY IF EXISTS "Anyone can view abattoir sales" ON abattoir_sales;
CREATE POLICY "Anyone can view abattoir sales" ON abattoir_sales
    FOR SELECT USING (TRUE);

-- Abattoirs can manage their own sales
DROP POLICY IF EXISTS "Abattoirs can manage their sales" ON abattoir_sales;
CREATE POLICY "Abattoirs can manage their sales" ON abattoir_sales
    FOR ALL USING (
        abattoir_id IN (
            SELECT id FROM abattoirs WHERE id IN (
                SELECT abattoir_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Create RLS policies for transports
-- Transporters can view their own transports
DROP POLICY IF EXISTS "Transporters can view their transports" ON transports;
CREATE POLICY "Transporters can view their transports" ON transports
    FOR SELECT USING (transporter_id = auth.uid());

-- Transporters can update their own transports
DROP POLICY IF EXISTS "Transporters can update their transports" ON transports;
CREATE POLICY "Transporters can update their transports" ON transports
    FOR UPDATE USING (transporter_id = auth.uid());

-- Farmers and buyers can view transports for their animals
DROP POLICY IF EXISTS "Users can view transports for their animals" ON transports;
CREATE POLICY "Users can view transports for their animals" ON transports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE animals.id = transports.animal_id 
            AND (
                animals.farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid()) OR
                animals.id IN (SELECT animal_id FROM transactions WHERE buyer_id = auth.uid())
            )
        )
    );

-- Create RLS policies for ews_disease_alerts
-- Anyone can view active disease alerts
DROP POLICY IF EXISTS "Anyone can view active disease alerts" ON ews_disease_alerts;
CREATE POLICY "Anyone can view active disease alerts" ON ews_disease_alerts
    FOR SELECT USING (is_active = TRUE);

-- Regulators can manage disease alerts
DROP POLICY IF EXISTS "Regulators can manage disease alerts" ON ews_disease_alerts;
CREATE POLICY "Regulators can manage disease alerts" ON ews_disease_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'regulator'
        )
    );