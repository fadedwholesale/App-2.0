-- Fix orders table structure to accept email addresses as user_id
-- Drop existing table if it exists
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table with proper structure
CREATE TABLE public.orders (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT UNIQUE DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id TEXT NOT NULL, -- Changed from UUID to TEXT to accept email addresses
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    address TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    driver_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;
DROP POLICY IF EXISTS "users_insert_own_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_read_all_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_update_all_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_delete_orders" ON public.orders;

-- Create new policies for email-based user_id
CREATE POLICY "users_read_own_orders" ON public.orders
    FOR SELECT TO authenticated
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "users_insert_own_orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.jwt() ->> 'email');

CREATE POLICY "admins_read_all_orders" ON public.orders
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "admins_update_all_orders" ON public.orders
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "admins_delete_orders" ON public.orders
    FOR DELETE TO authenticated
    USING (true);

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders' 
AND schemaname = 'public';


