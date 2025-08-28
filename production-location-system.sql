-- Production Location Tracking System for 1000+ Drivers
-- Optimized for high-performance real-time tracking

-- Drop existing location columns to ensure clean setup
ALTER TABLE drivers DROP COLUMN IF EXISTS current_location;
ALTER TABLE drivers DROP COLUMN IF EXISTS location_updated_at;

-- Add optimized location tracking fields
ALTER TABLE drivers 
ADD COLUMN current_location JSONB,
ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;

-- Create high-performance indexes for 1000+ drivers
CREATE INDEX IF NOT EXISTS idx_drivers_location_gin ON drivers USING GIN (current_location);
CREATE INDEX IF NOT EXISTS idx_drivers_online_location ON drivers (is_online, location_updated_at) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_drivers_available_location ON drivers (is_available, location_updated_at) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_drivers_location_updated ON drivers (location_updated_at DESC);

-- Enable RLS for security
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON drivers;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON drivers;
DROP POLICY IF EXISTS "Drivers can update their own location" ON drivers;
DROP POLICY IF EXISTS "Admins can read driver locations" ON drivers;

-- Create optimized RLS policies for 1000+ drivers
CREATE POLICY "drivers_select_policy" ON drivers 
    FOR SELECT USING (
        -- Drivers can read their own data
        auth.uid() = user_id 
        OR 
        -- Admins can read all driver data
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data::text LIKE '%"role":"admin"%'
        )
    );

CREATE POLICY "drivers_insert_policy" ON drivers 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "drivers_update_policy" ON drivers 
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add performance comments
COMMENT ON COLUMN drivers.current_location IS 'High-performance GPS coordinates as JSONB {lat: number, lng: number} for 1000+ drivers';
COMMENT ON COLUMN drivers.location_updated_at IS 'Timestamp for real-time location tracking with 1-second precision';

-- Create a function to update driver location efficiently
CREATE OR REPLACE FUNCTION update_driver_location(
    driver_user_id UUID,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE drivers 
    SET 
        current_location = jsonb_build_object('lat', lat, 'lng', lng),
        location_updated_at = NOW()
    WHERE user_id = driver_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_driver_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Create a view for online drivers with locations (optimized for admin dashboard)
CREATE OR REPLACE VIEW online_drivers_with_locations AS
SELECT 
    id,
    user_id,
    name,
    email,
    phone,
    is_online,
    is_available,
    current_location,
    location_updated_at,
    created_at,
    updated_at
FROM drivers 
WHERE is_online = true 
AND current_location IS NOT NULL
ORDER BY location_updated_at DESC;

-- Grant access to the view
GRANT SELECT ON online_drivers_with_locations TO authenticated;

-- Add performance monitoring
COMMENT ON TABLE drivers IS 'Production drivers table optimized for 1000+ concurrent drivers with real-time location tracking';
COMMENT ON VIEW online_drivers_with_locations IS 'Optimized view for admin dashboard showing only online drivers with valid locations';
