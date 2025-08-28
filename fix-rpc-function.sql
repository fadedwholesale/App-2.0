-- Fix the RPC function with ambiguous column references
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



