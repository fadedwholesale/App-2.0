-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT UNIQUE DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id TEXT NOT NULL,
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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_read_own_orders" ON public.orders;
DROP POLICY IF EXISTS "users_insert_own_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_read_all_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_update_all_orders" ON public.orders;
DROP POLICY IF EXISTS "admins_delete_orders" ON public.orders;

-- Create new policies
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


