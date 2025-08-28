-- Fix driver profile for cydiatools32@gmail.com
-- First, let's check if the user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    user_metadata
FROM auth.users 
WHERE email = 'cydiatools32@gmail.com';

-- Check if the drivers table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'drivers'
) as drivers_table_exists;

-- If the drivers table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.drivers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    license_number TEXT NOT NULL,
    vehicle_make TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    vehicle_color TEXT,
    license_plate TEXT,
    is_online BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT false,
    current_location JSONB DEFAULT '{"lat": 0, "lng": 0}',
    rating DECIMAL(3,2) DEFAULT 5.0,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON public.drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON public.drivers(is_available);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DROP POLICY IF EXISTS "drivers_read_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update_own" ON public.drivers;
DROP POLICY IF EXISTS "admins_read_all_drivers" ON public.drivers;
DROP POLICY IF EXISTS "admins_update_all_drivers" ON public.drivers;

CREATE POLICY "drivers_read_own" ON public.drivers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "drivers_insert_own" ON public.drivers
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "drivers_update_own" ON public.drivers
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins_read_all_drivers" ON public.drivers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "admins_update_all_drivers" ON public.drivers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Check if the driver profile exists for this user
SELECT * FROM public.drivers WHERE email = 'cydiatools32@gmail.com';

-- If no driver profile exists, create one manually
-- First, get the user_id from auth.users
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user_id for cydiatools32@gmail.com
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'cydiatools32@gmail.com';
    
    -- Check if driver profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.drivers WHERE user_id = user_uuid) THEN
        -- Insert the driver profile
        INSERT INTO public.drivers (
            user_id,
            name,
            phone,
            email,
            license_number,
            vehicle_make,
            vehicle_model,
            vehicle_year,
            vehicle_color,
            license_plate
        ) VALUES (
            user_uuid,
            'Jackeline Carrillo',
            '',
            'cydiatools32@gmail.com',
            'PENDING',
            'PENDING',
            'PENDING',
            2024,
            'PENDING',
            'PENDING'
        );
        
        RAISE NOTICE 'Driver profile created for cydiatools32@gmail.com';
    ELSE
        RAISE NOTICE 'Driver profile already exists for cydiatools32@gmail.com';
    END IF;
END $$;

-- Verify the driver profile was created
SELECT 
    d.id,
    d.name,
    d.email,
    d.phone,
    d.license_number,
    d.vehicle_make,
    d.vehicle_model,
    d.vehicle_year,
    d.is_online,
    d.is_available,
    d.rating,
    d.total_deliveries,
    d.created_at
FROM public.drivers d
WHERE d.email = 'cydiatools32@gmail.com';


