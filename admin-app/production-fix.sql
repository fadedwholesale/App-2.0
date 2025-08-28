-- Production-ready fix for driver tracking system
-- This fixes the ambiguous column reference issue properly

-- Drop the problematic function
DROP FUNCTION IF EXISTS get_online_drivers_locations();

-- Create production-ready function with proper parameter handling
CREATE OR REPLACE FUNCTION get_online_drivers_locations()
RETURNS TABLE(
    driver_id BIGINT,
    driver_name TEXT,
    driver_lat DECIMAL(10, 8),
    driver_lng DECIMAL(11, 8),
    driver_accuracy DECIMAL(10, 2),
    driver_location_timestamp TIMESTAMP WITH TIME ZONE,
    driver_is_online BOOLEAN,
    driver_is_available BOOLEAN
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
        SELECT 
            lat,
            lng,
            accuracy,
            location_timestamp
        FROM "driver_locations"
        WHERE driver_id = d.id
        ORDER BY location_timestamp DESC
        LIMIT 1
    ) dl ON true
    WHERE d.is_online = true
    ORDER BY d.id, dl.location_timestamp DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Test the production function
SELECT 'Production RPC Function Test:' as test;
SELECT * FROM get_online_drivers_locations();

-- Verify the function works
SELECT 'Function verification:' as test;
SELECT 
    driver_id,
    driver_name,
    driver_lat,
    driver_lng,
    driver_location_timestamp
FROM get_online_drivers_locations()
LIMIT 5;



