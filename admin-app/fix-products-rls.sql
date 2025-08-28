-- Fix RLS policies for products table
-- These policies control access to the products table in Supabase

-- First, ensure RLS is enabled on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to read products (for user app)
CREATE POLICY "public_read_products" ON public.products
    FOR SELECT TO authenticated, anon
    USING (true);

-- Policy 2: Allow authenticated users to insert products (for admin app)
CREATE POLICY "authenticated_insert_products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Policy 3: Allow authenticated users to update products (for admin app)
CREATE POLICY "authenticated_update_products" ON public.products
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete products (for admin app)
CREATE POLICY "authenticated_delete_products" ON public.products
    FOR DELETE TO authenticated
    USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'products' 
AND schemaname = 'public';
