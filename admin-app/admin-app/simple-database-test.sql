-- Simple Database Test - Check what's working
-- Run this in Supabase SQL Editor

-- 1. Check if driver_locations table exists and has data
SELECT 'driver_locations table check:' as test;
SELECT COUNT(*) as total_locations FROM driver_locations;
SELECT COUNT(*) as recent_locations FROM driver_locations WHERE location_timestamp > NOW() - INTERVAL '1 hour';

-- 2. Check if drivers are online
SELECT 'online drivers check:' as test;
SELECT id, name, is_online, is_available, current_location FROM drivers WHERE is_online = true;

-- 3. Check if real-time tracking view works
SELECT 'real-time tracking view check:' as test;
SELECT * FROM real_time_driver_tracking LIMIT 5;

-- 4. Check if orders exist
SELECT 'orders check:' as test;
SELECT COUNT(*) as total_orders, COUNT(*) FILTER (WHERE driver_id IS NOT NULL) as assigned_orders FROM orders;

-- 5. Test RPC function
SELECT 'RPC function check:' as test;
SELECT * FROM get_online_drivers_locations();



