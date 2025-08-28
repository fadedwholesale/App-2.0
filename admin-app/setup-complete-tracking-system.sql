-- Complete Driver Tracking & Admin Dispatch System Setup
-- Run this in Supabase SQL Editor

-- 1. Ensure driver_locations table exists
CREATE TABLE IF NOT EXISTS "driver_locations" (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    speed DECIMAL(8, 2),
    altitude DECIMAL(10, 2),
    location_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_id ON "driver_locations"(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON "driver_locations"(location_timestamp);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_timestamp ON "driver_locations"(driver_id, location_timestamp DESC);

-- 3. Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_driver_locations_driver' 
        AND table_name = 'driver_locations'
    ) THEN
        ALTER TABLE "driver_locations" 
        ADD CONSTRAINT fk_driver_locations_driver 
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Ensure current_order_id column exists in drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_order_id BIGINT;

-- 5. Create function to insert driver location
DROP FUNCTION IF EXISTS insert_driver_location(BIGINT, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL, DECIMAL);
CREATE OR REPLACE FUNCTION insert_driver_location(
    p_driver_id BIGINT,
    p_lat DECIMAL(10, 8),
    p_lng DECIMAL(11, 8),
    p_accuracy DECIMAL(10, 2) DEFAULT NULL,
    p_heading DECIMAL(5, 2) DEFAULT NULL,
    p_speed DECIMAL(8, 2) DEFAULT NULL,
    p_altitude DECIMAL(10, 2) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Insert into driver_locations table
    INSERT INTO "driver_locations" (
        driver_id, lat, lng, accuracy, heading, speed, altitude
    ) VALUES (
        p_driver_id, p_lat, p_lng, p_accuracy, p_heading, p_speed, p_altitude
    );
    
    -- Update drivers table with current location
    UPDATE drivers 
    SET 
        current_location = jsonb_build_object('lat', p_lat, 'lng', p_lng),
        location_updated_at = NOW()
    WHERE id = p_driver_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to get latest driver location
DROP FUNCTION IF EXISTS get_driver_latest_location(BIGINT);
CREATE OR REPLACE FUNCTION get_driver_latest_location(p_driver_id BIGINT)
RETURNS TABLE(
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    location_timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl.lat,
        dl.lng,
        dl.accuracy,
        dl.location_timestamp
    FROM "driver_locations" dl
    WHERE dl.driver_id = p_driver_id
    ORDER BY dl.location_timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get all online drivers locations
DROP FUNCTION IF EXISTS get_online_drivers_locations();
CREATE OR REPLACE FUNCTION get_online_drivers_locations()
RETURNS TABLE(
    driver_id BIGINT,
    driver_name TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    location_timestamp TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (d.id)
        d.id,
        d.name,
        dl.lat,
        dl.lng,
        dl.accuracy,
        dl.location_timestamp,
        d.is_online,
        d.is_available
    FROM drivers d
    LEFT JOIN LATERAL (
        SELECT lat, lng, accuracy, location_timestamp
        FROM "driver_locations"
        WHERE driver_id = d.id
        ORDER BY location_timestamp DESC
        LIMIT 1
    ) dl ON true
    WHERE d.is_online = true
    ORDER BY d.id, dl.location_timestamp DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 8. Create real-time driver tracking view
CREATE OR REPLACE VIEW real_time_driver_tracking AS
SELECT DISTINCT ON (d.id)
    d.id,
    d.name,
    d.email,
    d.phone,
    d.is_online,
    d.is_available,
    d.rating,
    d.total_deliveries,
    d.current_order_id,
    dl.lat,
    dl.lng,
    dl.accuracy,
    dl.location_timestamp,
    d.current_location,
    d.location_updated_at
FROM drivers d
LEFT JOIN LATERAL (
    SELECT lat, lng, accuracy, location_timestamp
    FROM "driver_locations"
    WHERE driver_id = d.id
    ORDER BY location_timestamp DESC
    LIMIT 1
) dl ON true
WHERE d.is_online = true
ORDER BY d.id, dl.location_timestamp DESC NULLS LAST;

-- 9. Create trigger to update driver current location
CREATE OR REPLACE FUNCTION trigger_update_driver_current_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Update drivers table with current location
    UPDATE drivers 
    SET 
        current_location = jsonb_build_object('lat', NEW.lat, 'lng', NEW.lng),
        location_updated_at = NEW.location_timestamp
    WHERE id = NEW.driver_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_driver_current_location_trigger'
    ) THEN
        CREATE TRIGGER update_driver_current_location_trigger
            AFTER INSERT ON "driver_locations"
            FOR EACH ROW
            EXECUTE FUNCTION trigger_update_driver_current_location();
    END IF;
END $$;

-- 11. Enable Row Level Security
ALTER TABLE "driver_locations" ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies
-- Drivers can view and insert their own locations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'driver_locations' 
        AND policyname = 'Drivers can view own locations'
    ) THEN
        CREATE POLICY "Drivers can view own locations" ON "driver_locations"
            FOR SELECT USING (
                auth.uid() IN (SELECT user_id FROM drivers WHERE id = driver_id)
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'driver_locations' 
        AND policyname = 'Drivers can insert own locations'
    ) THEN
        CREATE POLICY "Drivers can insert own locations" ON "driver_locations"
            FOR INSERT WITH CHECK (
                auth.uid() IN (SELECT user_id FROM drivers WHERE id = driver_id)
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'driver_locations' 
        AND policyname = 'Admins can view all locations'
    ) THEN
        CREATE POLICY "Admins can view all locations" ON "driver_locations"
            FOR SELECT USING (
                auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data::text LIKE '%"role":"admin"%')
            );
    END IF;
END $$;

-- 13. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON "driver_locations" TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 14. Enable real-time for driver_locations table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'driver_locations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "driver_locations";
    END IF;
END $$;

-- 15. Create admin dispatch view
CREATE OR REPLACE VIEW admin_dispatch_view AS
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.email as driver_email,
    d.phone as driver_phone,
    d.is_online,
    d.is_available,
    d.rating,
    d.total_deliveries,
    d.current_order_id,
    dl.lat as current_lat,
    dl.lng as current_lng,
    dl.accuracy,
    dl.location_timestamp,
    o.id as active_order_id,
    o.status as order_status,
    o.delivery_lat,
    o.delivery_lng,
    o.customer_name,
    o.customer_phone
FROM drivers d
LEFT JOIN LATERAL (
    SELECT lat, lng, accuracy, location_timestamp
    FROM "driver_locations"
    WHERE driver_id = d.id
    ORDER BY location_timestamp DESC
    LIMIT 1
) dl ON true
LEFT JOIN orders o ON d.current_order_id = o.id
WHERE d.is_online = true
ORDER BY dl.location_timestamp DESC NULLS LAST;

-- 16. Test data insertion (optional - for testing)
-- INSERT INTO "driver_locations" (driver_id, lat, lng, accuracy) 
-- VALUES (2, 29.622832, -98.644196, 10.0);

-- 17. Verify setup
SELECT 'Driver tracking system setup complete!' as status;
SELECT COUNT(*) as driver_locations_count FROM "driver_locations";
SELECT COUNT(*) as online_drivers FROM drivers WHERE is_online = true;
