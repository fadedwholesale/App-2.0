-- Create drivers table for driver registration and management
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON public.drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_online ON public.drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON public.drivers(is_available);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "drivers_read_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update_own" ON public.drivers;
DROP POLICY IF EXISTS "admins_read_all_drivers" ON public.drivers;
DROP POLICY IF EXISTS "admins_update_all_drivers" ON public.drivers;

-- Create policies
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

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'drivers' 
AND schemaname = 'public';
