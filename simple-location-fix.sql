-- Simple location tracking fix
-- Add location columns to drivers table

-- Add location tracking fields
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIN (current_location);

-- Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
CREATE POLICY "Enable read access for all users" ON drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON drivers;
CREATE POLICY "Enable insert for authenticated users only" ON drivers FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON drivers;
CREATE POLICY "Enable update for users based on user_id" ON drivers FOR UPDATE USING (auth.uid() = user_id);

-- Add comments
COMMENT ON COLUMN drivers.current_location IS 'Current GPS coordinates as JSONB {lat: number, lng: number}';
COMMENT ON COLUMN drivers.location_updated_at IS 'Timestamp when location was last updated';




