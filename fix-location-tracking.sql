-- Fix location tracking in database
-- Drop and recreate location columns to ensure proper structure

-- First, drop existing location columns if they exist
ALTER TABLE drivers DROP COLUMN IF EXISTS current_location;
ALTER TABLE drivers DROP COLUMN IF EXISTS location_updated_at;

-- Add location columns with proper structure
ALTER TABLE drivers 
ADD COLUMN current_location JSONB DEFAULT NULL,
ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIN (current_location);
CREATE INDEX IF NOT EXISTS idx_drivers_location_updated ON drivers (location_updated_at);

-- Drop all existing RLS policies for drivers
DROP POLICY IF EXISTS "Drivers can update their own location" ON drivers;
DROP POLICY IF EXISTS "Admins can read driver locations" ON drivers;
DROP POLICY IF EXISTS "Drivers can update own location" ON drivers;
DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON drivers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON drivers;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON drivers;

-- Create new RLS policies for location tracking
CREATE POLICY "Drivers can update their own location" ON drivers
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read driver locations" ON drivers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data::text LIKE '%"role":"admin"%'
        )
    );

CREATE POLICY "Drivers can read their own data" ON drivers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Drivers can insert their own data" ON drivers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own data" ON drivers
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON COLUMN drivers.current_location IS 'Current GPS coordinates as JSONB {lat: number, lng: number}';
COMMENT ON COLUMN drivers.location_updated_at IS 'Timestamp when location was last updated';

-- Enable RLS on drivers table
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Test insert to verify structure
-- This will be cleaned up after verification
INSERT INTO drivers (user_id, name, email, phone, is_online, is_available, current_location, location_updated_at, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'TEST_DRIVER_LOCATION',
    'test@location.com',
    '555-0000',
    false,
    false,
    '{"lat": 37.7749, "lng": -122.4194}'::jsonb,
    NOW(),
    NOW(),
    NOW()
);

-- Clean up test data
DELETE FROM drivers WHERE email = 'test@location.com';

-- Verify the structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND column_name IN ('current_location', 'location_updated_at')
ORDER BY column_name;
