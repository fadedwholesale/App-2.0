-- Test Current Status - Check what's working now
-- Run this in Supabase SQL Editor

-- 1. Check if driver_locations table has recent data
SELECT 'Recent GPS data:' as test;
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

-- 2. Check online drivers
SELECT 'Online drivers:' as test;
SELECT 
    id,
    name,
    is_online,
    is_available,
    current_location,
    location_updated_at
FROM drivers 
WHERE is_online = true;

-- 3. Test the fixed RPC function
SELECT 'RPC function test:' as test;
SELECT * FROM get_online_drivers_locations();

-- 4. Check real-time tracking view
SELECT 'Real-time tracking view:' as test;
SELECT 
    id,
    name,
    lat,
    lng,
    location_timestamp,
    is_online
FROM real_time_driver_tracking
LIMIT 5;



