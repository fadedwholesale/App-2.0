-- Final Test - Check if tracking system is working
-- Run this in Supabase SQL Editor

-- 1. Check if driver_locations table has data
SELECT 'GPS Data Check:' as test;
SELECT COUNT(*) as total_locations FROM driver_locations;
SELECT COUNT(*) as recent_locations FROM driver_locations WHERE location_timestamp > NOW() - INTERVAL '10 minutes';

-- 2. Check online drivers
SELECT 'Online Drivers:' as test;
SELECT id, name, is_online, is_available FROM drivers WHERE is_online = true;

-- 3. Test the fixed RPC function
SELECT 'RPC Function Test:' as test;
SELECT * FROM get_online_drivers_locations();

-- 4. Test the fixed real-time view
SELECT 'Real-time View Test:' as test;
SELECT id, name, lat, lng, location_timestamp FROM real_time_driver_tracking LIMIT 3;

-- 5. Check if any recent GPS data exists
SELECT 'Recent GPS Data:' as test;
SELECT 
    driver_id,
    lat,
    lng,
    location_timestamp
FROM driver_locations 
WHERE location_timestamp > NOW() - INTERVAL '1 hour'
ORDER BY location_timestamp DESC
LIMIT 5;



