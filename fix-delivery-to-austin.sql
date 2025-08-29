-- Fix delivery coordinates from San Antonio to Austin
-- Update orders that have San Antonio coordinates (around 29.6 latitude) to Austin coordinates

UPDATE orders 
SET 
  delivery_lat = 30.2672,  -- Austin downtown latitude
  delivery_lng = -97.7431  -- Austin downtown longitude
WHERE 
  delivery_lat BETWEEN 29.5 AND 30.0 
  AND delivery_lng BETWEEN -98.7 AND -98.6;

-- Verify the fix
SELECT 
  id, 
  delivery_lat, 
  delivery_lng 
FROM orders 
ORDER BY updated_at DESC 
LIMIT 5;
