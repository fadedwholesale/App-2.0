-- Check current orders table status
-- Run this first to see what we're working with

-- Check if orders table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check current orders data
SELECT 
    id,
    order_id,
    user_id,
    customer_name,
    customer_phone,
    status,
    created_at,
    CASE 
        WHEN user_id IS NULL THEN 'NULL'
        WHEN user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'EMAIL'
        WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        ELSE 'INVALID'
    END as user_id_type
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Count orders by user_id type
SELECT 
    CASE 
        WHEN user_id IS NULL THEN 'NULL'
        WHEN user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'EMAIL'
        WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        ELSE 'INVALID'
    END as user_id_type,
    COUNT(*) as count
FROM orders 
GROUP BY 
    CASE 
        WHEN user_id IS NULL THEN 'NULL'
        WHEN user_id ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN 'EMAIL'
        WHEN user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'UUID'
        ELSE 'INVALID'
    END;

