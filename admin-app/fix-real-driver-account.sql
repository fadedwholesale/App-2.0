-- Fix real driver account for cydiatools32@gmail.com
-- This script ensures the driver account exists and is properly configured

-- First, let's check if the driver exists
SELECT 
  id,
  name,
  email,
  user_id,
  is_online,
  is_available,
  is_approved,
  created_at,
  updated_at
FROM drivers 
WHERE email = 'cydiatools32@gmail.com';

-- If the driver doesn't exist, we need to create it
-- But first we need to get the user_id from auth.users
-- Since we can't directly access auth.users from this script,
-- we'll create a placeholder that can be updated manually

-- Insert driver profile if it doesn't exist
INSERT INTO drivers (
  user_id,
  name,
  email,
  phone,
  license_number,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  vehicle_color,
  license_plate,
  is_online,
  is_available,
  is_approved,
  rating,
  total_deliveries,
  created_at,
  updated_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000', -- Placeholder user_id - needs to be updated manually
  'Jackeline Carrillo',
  'cydiatools32@gmail.com',
  '',
  '',
  '',
  '',
  NULL,
  '',
  '',
  false,
  false,
  true,
  5.0,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE email = 'cydiatools32@gmail.com'
);

-- Update existing driver to ensure proper settings
UPDATE drivers 
SET 
  is_approved = true,
  is_online = false,
  is_available = false,
  updated_at = NOW()
WHERE email = 'cydiatools32@gmail.com';

-- Show the final state
SELECT 
  id,
  name,
  email,
  user_id,
  is_online,
  is_available,
  is_approved,
  created_at,
  updated_at
FROM drivers 
WHERE email = 'cydiatools32@gmail.com';




