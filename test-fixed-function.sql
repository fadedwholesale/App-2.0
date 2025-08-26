-- Test the fixed RPC function
SELECT 'Testing fixed RPC function:' as test;
SELECT * FROM get_online_drivers_locations();

-- Test the real-time view
SELECT 'Testing real-time view:' as test;
SELECT * FROM real_time_driver_tracking LIMIT 5;

-- Check if any GPS data exists
SELECT 'GPS data check:' as test;
SELECT COUNT(*) as total_locations FROM driver_locations;
SELECT COUNT(*) as recent_locations FROM driver_locations WHERE location_timestamp > NOW() - INTERVAL '1 hour';



