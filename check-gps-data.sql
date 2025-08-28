-- Check recent GPS data from driver app
SELECT 'Recent GPS data (last hour):' as test;
SELECT 
    driver_id,
    lat,
    lng,
    accuracy,
    location_timestamp
FROM driver_locations 
WHERE location_timestamp > NOW() - INTERVAL '1 hour'
ORDER BY location_timestamp DESC
LIMIT 10;

SELECT 'All GPS data count:' as test;
SELECT COUNT(*) as total_locations FROM driver_locations;

SELECT 'Latest GPS entry:' as test;
SELECT 
    driver_id,
    lat,
    lng,
    location_timestamp
FROM driver_locations 
ORDER BY location_timestamp DESC
LIMIT 1;



