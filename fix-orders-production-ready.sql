-- PRODUCTION-READY: Fix orders table structure and migrate existing data
-- This script ensures the orders table has proper UUID user_id and migrates existing data

-- First, let's check what we have in the current orders table
DO $$
BEGIN
  RAISE NOTICE 'Checking current orders table structure...';
END $$;

-- Create a backup of existing orders if they exist
CREATE TABLE IF NOT EXISTS orders_backup AS 
SELECT * FROM orders WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders');

-- Drop existing table and recreate with proper structure
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table with proper UUID structure
CREATE TABLE public.orders (
    id BIGSERIAL PRIMARY KEY,
    order_id TEXT UNIQUE DEFAULT 'ORD-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    user_id UUID NOT NULL, -- Proper UUID for user_id
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

-- Create production-ready policies for UUID-based user_id
CREATE POLICY "users_read_own_orders" ON public.orders
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_orders" ON public.orders
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

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

-- Migrate existing orders from backup if they exist
DO $$
DECLARE
    backup_count INTEGER;
    migrated_count INTEGER := 0;
    order_record RECORD;
    user_uuid UUID;
    user_id_text TEXT;
BEGIN
    -- Check if we have backup data
    SELECT COUNT(*) INTO backup_count FROM orders_backup;
    
    IF backup_count > 0 THEN
        RAISE NOTICE 'Found % orders in backup, attempting migration...', backup_count;
        
        -- Try to migrate each order
        FOR order_record IN SELECT * FROM orders_backup LOOP
            -- Convert user_id to text for pattern matching
            user_id_text := order_record.user_id::TEXT;
            
            -- Try to find the user by email if user_id is an email
            IF user_id_text ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
                -- user_id is an email, try to find the user
                SELECT id INTO user_uuid FROM users WHERE email = user_id_text;
                
                IF user_uuid IS NOT NULL THEN
                    -- Insert with proper UUID
                    INSERT INTO orders (
                        order_id, user_id, customer_name, customer_phone, 
                        address, items, total, status, driver_id, 
                        created_at, updated_at
                    ) VALUES (
                        order_record.order_id, user_uuid, order_record.customer_name, 
                        order_record.customer_phone, order_record.address, 
                        order_record.items, order_record.total, order_record.status, 
                        order_record.driver_id, order_record.created_at, order_record.updated_at
                    );
                    migrated_count := migrated_count + 1;
                    RAISE NOTICE 'Migrated order % with email user_id % to UUID %', order_record.order_id, user_id_text, user_uuid;
                ELSE
                    RAISE NOTICE 'Could not find user with email: %', user_id_text;
                END IF;
            ELSIF user_id_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                -- user_id is already a UUID, insert directly
                INSERT INTO orders (
                    order_id, user_id, customer_name, customer_phone, 
                    address, items, total, status, driver_id, 
                    created_at, updated_at
                ) VALUES (
                    order_record.order_id, order_record.user_id::UUID, order_record.customer_name, 
                    order_record.customer_phone, order_record.address, 
                    order_record.items, order_record.total, order_record.status, 
                    order_record.driver_id, order_record.created_at, order_record.updated_at
                );
                migrated_count := migrated_count + 1;
                RAISE NOTICE 'Migrated order % with UUID user_id %', order_record.order_id, user_id_text;
            ELSE
                RAISE NOTICE 'Invalid user_id format: %', user_id_text;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Successfully migrated % out of % orders', migrated_count, backup_count;
    ELSE
        RAISE NOTICE 'No existing orders found to migrate';
    END IF;
END $$;

-- Clean up backup table
DROP TABLE IF EXISTS orders_backup;

-- Verify the table structure
SELECT 
    'Orders table created successfully!' as status,
    COUNT(*) as total_orders
FROM orders;
