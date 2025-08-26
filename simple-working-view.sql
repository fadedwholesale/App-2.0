-- Create a simple working view for online drivers
DROP VIEW IF EXISTS simple_online_drivers;

CREATE VIEW simple_online_drivers AS
SELECT 
    d.id,
    d.name,
    d.email,
    d.phone,
    d.is_online,
    d.is_available,
    d.rating,
    d.total_deliveries,
    d.current_order_id,
    d.current_location,
    d.location_updated_at
FROM drivers d
WHERE d.is_online = true
ORDER BY d.location_updated_at DESC NULLS LAST;

-- Test the simple view
SELECT 'Simple Online Drivers View:' as test;
SELECT * FROM simple_online_drivers;



