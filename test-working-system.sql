-- Test if the tracking system is working
SELECT 'Testing RPC function:' as test;
SELECT * FROM get_online_drivers_locations();

SELECT 'Testing real-time view:' as test;
SELECT * FROM real_time_driver_tracking LIMIT 5;

SELECT 'GPS data count:' as test;
SELECT COUNT(*) as total_locations FROM driver_locations;
SELECT COUNT(*) as recent_locations FROM driver_locations WHERE location_timestamp > NOW() - INTERVAL '1 hour';

SELECT 'Online drivers:' as test;
SELECT id, name, is_online, is_available FROM drivers WHERE is_online = true;



