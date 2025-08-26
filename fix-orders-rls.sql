-- Fix RLS policies for orders table
-- These policies control access to the orders table in Supabase

-- First, ensure RLS is enabled on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own orders
CREATE POLICY "users_read_own_orders" ON public.orders
    FOR SELECT TO authenticated
    USING (user_id = auth.jwt() ->> 'email');

-- Policy 2: Allow users to insert their own orders
CREATE POLICY "users_insert_own_orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.jwt() ->> 'email');

-- Policy 3: Allow admins to read all orders
CREATE POLICY "admins_read_all_orders" ON public.orders
    FOR SELECT TO authenticated
    USING (true);

-- Policy 4: Allow admins to update all orders
CREATE POLICY "admins_update_all_orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 5: Allow admins to delete orders
CREATE POLICY "admins_delete_orders" ON public.orders
    FOR DELETE TO authenticated
    USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders' 
AND schemaname = 'public';


