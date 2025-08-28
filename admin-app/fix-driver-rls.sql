-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR TO FIX DRIVER RLS POLICIES

-- Drop existing policies
DROP POLICY IF EXISTS "drivers_read_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_insert_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update_own" ON public.drivers;
DROP POLICY IF EXISTS "drivers_update_own_status" ON public.drivers;
DROP POLICY IF EXISTS "admins_read_all_drivers" ON public.drivers;
DROP POLICY IF EXISTS "admins_update_all_drivers" ON public.drivers;

-- Create policies for drivers to read their own profile
CREATE POLICY "drivers_read_own" ON public.drivers
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Create policies for drivers to insert their own profile
CREATE POLICY "drivers_insert_own" ON public.drivers
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Create policies for drivers to update their own profile (including status)
CREATE POLICY "drivers_update_own" ON public.drivers
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Create policies for admins to read all drivers
CREATE POLICY "admins_read_all_drivers" ON public.drivers
    FOR SELECT TO authenticated
    USING (true);

-- Create policies for admins to update all drivers
CREATE POLICY "admins_update_all_drivers" ON public.drivers
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'drivers' 
AND schemaname = 'public'
ORDER BY policyname;




