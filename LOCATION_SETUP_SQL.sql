-- Add location tracking fields to drivers table for live tracking
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIN (current_location);

-- Update RLS policies to allow location updates
DROP POLICY IF EXISTS "Drivers can update their own location" ON drivers;
CREATE POLICY "Drivers can update their own location" ON drivers
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to read driver locations
DROP POLICY IF EXISTS "Admins can read driver locations" ON drivers;
CREATE POLICY "Admins can read driver locations" ON drivers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow drivers to update their own location
DROP POLICY IF EXISTS "Drivers can update own location" ON drivers;
CREATE POLICY "Drivers can update own location" ON drivers
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON COLUMN drivers.current_location IS 'Current GPS coordinates as JSONB {lat: number, lng: number}';
COMMENT ON COLUMN drivers.location_updated_at IS 'Timestamp when location was last updated';
