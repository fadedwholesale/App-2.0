-- Force GPS test - manually insert coordinates to test database
INSERT INTO driver_locations (driver_id, lat, lng, accuracy, location_timestamp)
VALUES (2, 29.622832, -98.644196, 10.0, NOW());

-- Check if it was inserted
SELECT 'GPS test data:' as test;
SELECT 
    driver_id,
    lat,
    lng,
    accuracy,
    location_timestamp
FROM driver_locations 
WHERE driver_id = 2
ORDER BY location_timestamp DESC
LIMIT 5;

-- Check if driver current_location was updated
SELECT 'Driver current location:' as test;
SELECT 
    id,
    name,
    current_location,
    location_updated_at
FROM drivers 
WHERE id = 2;



