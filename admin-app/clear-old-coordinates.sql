-- Clear old hardcoded coordinates from database
UPDATE drivers 
SET 
    current_location = NULL,
    location_updated_at = NULL
WHERE current_location = '{"lat":37.3349,"lng":-122.009}'::jsonb;

-- Clear old GPS data
DELETE FROM driver_locations 
WHERE lat = 37.3349 AND lng = -122.009;

-- Verify cleanup
SELECT 'Drivers with old coordinates:' as check;
SELECT id, name, current_location FROM drivers WHERE current_location = '{"lat":37.3349,"lng":-122.009}'::jsonb;

SELECT 'Old GPS data remaining:' as check;
SELECT COUNT(*) as old_data_count FROM driver_locations WHERE lat = 37.3349 AND lng = -122.009;



