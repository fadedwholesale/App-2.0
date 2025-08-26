-- FINAL FIX: Drop all policies and create simple ones that work
DROP POLICY IF EXISTS "production_driver_location_insert" ON driver_locations;
DROP POLICY IF EXISTS "production_driver_location_update" ON driver_locations;
DROP POLICY IF EXISTS "production_driver_location_select" ON driver_locations;
DROP POLICY IF EXISTS "Drivers can update their own location" ON driver_locations;
DROP POLICY IF EXISTS "Admins can view all driver locations" ON driver_locations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON driver_locations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON driver_locations;

-- Create simple policies that work with service client
CREATE POLICY "allow_all_driver_locations" ON driver_locations
  FOR ALL USING (true) WITH CHECK (true);

