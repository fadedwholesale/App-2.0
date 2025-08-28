-- Add driver_id field to orders table for driver assignment
-- This allows orders to be assigned to specific drivers

-- Check if driver_id column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'driver_id';

-- Add driver_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'driver_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id);
        RAISE NOTICE 'Added driver_id column to orders table';
    ELSE
        RAISE NOTICE 'driver_id column already exists in orders table';
    END IF;
END $$;

-- Update RLS policies to allow drivers to see their assigned orders
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Drivers can view their assigned orders" ON orders;
DROP POLICY IF EXISTS "Drivers can update their assigned orders" ON orders;

-- Create new policies for driver access
CREATE POLICY "Drivers can view their assigned orders" ON orders
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Drivers can update their assigned orders" ON orders
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- Show the updated table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Show current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders';




