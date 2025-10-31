-- Tag Chain Marketplace Listings Table
-- Date: 2025-10-30

-- Create marketplace_listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id BIGINT REFERENCES animals(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USDC',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_animal ON marketplace_listings(animal_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created ON marketplace_listings(created_at);

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can view active marketplace listings
DROP POLICY IF EXISTS "Everyone can view active listings" ON marketplace_listings;
CREATE POLICY "Everyone can view active listings" ON marketplace_listings
    FOR SELECT USING (status = 'active');

-- Sellers can create listings for their animals
DROP POLICY IF EXISTS "Sellers can create listings" ON marketplace_listings;
CREATE POLICY "Sellers can create listings" ON marketplace_listings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM animals 
            WHERE animals.id = animal_id 
            AND animals.farmer_id = auth.uid()
        )
    );

-- Sellers can update their own listings
DROP POLICY IF EXISTS "Sellers can update their listings" ON marketplace_listings;
CREATE POLICY "Sellers can update their listings" ON marketplace_listings
    FOR UPDATE USING (
        seller_id = auth.uid()
    );

-- Sellers can delete their own listings
DROP POLICY IF EXISTS "Sellers can delete their listings" ON marketplace_listings;
CREATE POLICY "Sellers can delete their listings" ON marketplace_listings
    FOR DELETE USING (
        seller_id = auth.uid()
    );