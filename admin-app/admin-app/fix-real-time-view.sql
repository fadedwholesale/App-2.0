-- Fix the real-time tracking view
DROP VIEW IF EXISTS real_time_driver_tracking;

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



