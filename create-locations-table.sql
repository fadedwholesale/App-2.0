-- Real-Time Driver Location Tracking System
-- Dedicated locations table for efficient real-time updates

-- Create locations table for real-time driver tracking
CREATE TABLE IF NOT EXISTS "driver_locations" (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    altitude DECIMAL(8, 2),
    location_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON "driver_locations"(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON "driver_locations"(location_timestamp);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_timestamp ON "driver_locations"(driver_id, location_timestamp DESC);

-- Add foreign key constraint
ALTER TABLE "driver_locations" 
ADD CONSTRAINT fk_driver_locations_driver 
FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;

-- Add current_order_id column to drivers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'current_order_id'
    ) THEN
        ALTER TABLE drivers ADD COLUMN current_order_id BIGINT;
    END IF;
END $$;

-- Function to insert new location and update driver's current location
CREATE OR REPLACE FUNCTION insert_driver_location(
    p_driver_id BIGINT,
    p_lat DECIMAL(10, 8),
    p_lng DECIMAL(11, 8),
    p_accuracy DECIMAL(5, 2) DEFAULT NULL,
    p_heading DECIMAL(5, 2) DEFAULT NULL,
    p_speed DECIMAL(5, 2) DEFAULT NULL,
    p_altitude DECIMAL(8, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Insert into locations table
    INSERT INTO "driver_locations" (
        driver_id, lat, lng, accuracy, heading, speed, altitude
    ) VALUES (
        p_driver_id, p_lat, p_lng, p_accuracy, p_heading, p_speed, p_altitude
    );
    
    -- Update driver's current location
    UPDATE drivers 
    SET 
        current_location = jsonb_build_object('lat', p_lat, 'lng', p_lng),
        location_updated_at = NOW()
    WHERE id = p_driver_id;
    
    -- Log the update
    RAISE NOTICE 'Location updated for driver %: lat=%, lng=%', p_driver_id, p_lat, p_lng;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest location for a driver
CREATE OR REPLACE FUNCTION get_driver_latest_location(p_driver_id BIGINT)
RETURNS TABLE (
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    accuracy DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    altitude DECIMAL(8, 2),
    location_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl.lat,
        dl.lng,
        dl.accuracy,
        dl.heading,
        dl.speed,
        dl.altitude,
        dl.location_timestamp
    FROM "driver_locations" dl
    WHERE dl.driver_id = p_driver_id
    ORDER BY dl.location_timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get all online drivers' latest locations
CREATE OR REPLACE FUNCTION get_online_drivers_locations()
RETURNS TABLE (
    driver_id BIGINT,
    driver_name TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    accuracy DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(5, 2),
    altitude DECIMAL(8, 2),
    location_timestamp TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.name,
        dl.lat,
        dl.lng,
        dl.accuracy,
        dl.heading,
        dl.speed,
        dl.altitude,
        dl.location_timestamp,
        d.is_available
    FROM drivers d
    INNER JOIN LATERAL (
        SELECT lat, lng, accuracy, heading, speed, altitude, location_timestamp
        FROM "driver_locations"
        WHERE driver_id = d.id
        ORDER BY location_timestamp DESC
        LIMIT 1
    ) dl ON true
    WHERE d.is_online = true
    ORDER BY dl.location_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE "driver_locations" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_locations table
-- Drivers can view their own location history
CREATE POLICY "Drivers can view own location history" ON "driver_locations"
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM drivers WHERE id = driver_id
        )
    );

-- Drivers can insert their own locations
CREATE POLICY "Drivers can insert own locations" ON "driver_locations"
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM drivers WHERE id = driver_id
        )
    );

-- Admins can view all driver locations
CREATE POLICY "Admins can view all driver locations" ON "driver_locations"
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data::text LIKE '%"role":"admin"%'
        )
    );

-- Create view for real-time driver tracking
CREATE OR REPLACE VIEW real_time_driver_tracking AS
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.is_online,
    d.is_available,
    dl.lat,
    dl.lng,
    dl.accuracy,
    dl.heading,
    dl.speed,
    dl.altitude,
    dl.location_timestamp as location_timestamp,
    d.location_updated_at,
    d.current_order_id,
    d.vehicle_make,
    d.vehicle_model,
    d.vehicle_color,
    d.license_plate
FROM drivers d
    LEFT JOIN LATERAL (
        SELECT lat, lng, accuracy, heading, speed, altitude, location_timestamp
        FROM "driver_locations"
        WHERE driver_id = d.id
        ORDER BY location_timestamp DESC
        LIMIT 1
    ) dl ON true
WHERE d.is_online = true;

-- Grant permissions
GRANT SELECT ON real_time_driver_tracking TO authenticated;
GRANT SELECT, INSERT ON "driver_locations" TO authenticated;

-- Add current_order_id column to drivers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'current_order_id'
    ) THEN
        ALTER TABLE drivers ADD COLUMN current_order_id BIGINT;
    END IF;
END $$;

-- Enable real-time for driver_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE "driver_locations";

-- Create trigger to automatically update driver's current_location
CREATE OR REPLACE FUNCTION trigger_update_driver_current_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Update driver's current_location when new location is inserted
    UPDATE drivers 
    SET 
        current_location = jsonb_build_object('lat', NEW.lat, 'lng', NEW.lng),
        location_updated_at = NEW.location_timestamp
    WHERE id = NEW.driver_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_driver_current_location_trigger
    AFTER INSERT ON "driver_locations"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_driver_current_location();

-- Insert sample location data for testing (remove in production)
-- INSERT INTO "driver_locations" (driver_id, lat, lng, accuracy) 
-- VALUES (2, 29.622832, -98.644196, 5.0);

COMMENT ON TABLE "driver_locations" IS 'Real-time driver location tracking for live GPS updates';
COMMENT ON FUNCTION insert_driver_location IS 'Insert new driver location and update current location';
COMMENT ON FUNCTION get_driver_latest_location IS 'Get latest location for a specific driver';
COMMENT ON FUNCTION get_online_drivers_locations IS 'Get all online drivers latest locations';
COMMENT ON VIEW real_time_driver_tracking IS 'Real-time view of all online drivers with latest locations';
