-- Add user role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- Add user_type column for better categorization
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'customer';

-- Add is_admin boolean field
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add is_driver boolean field
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE;

-- Update existing users with proper roles
UPDATE users 
SET 
    role = CASE 
        WHEN email = 'diego.carrillo@fadedskies.com' THEN 'admin'
        WHEN email IN ('testdriver@example.com', 'cydiatools32@gmail.com') THEN 'driver'
        ELSE 'customer'
    END,
    user_type = CASE 
        WHEN email = 'diego.carrillo@fadedskies.com' THEN 'admin'
        WHEN email IN ('testdriver@example.com', 'cydiatools32@gmail.com') THEN 'driver'
        ELSE 'customer'
    END,
    is_admin = (email = 'diego.carrillo@fadedskies.com'),
    is_driver = (email IN ('testdriver@example.com', 'cydiatools32@gmail.com'))
WHERE email IN ('diego.carrillo@fadedskies.com', 'testdriver@example.com', 'cydiatools32@gmail.com', 'carrillo.diego9857@gmail.com');

-- Create user_roles table for better role management
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert role records for existing users
INSERT INTO user_roles (user_id, role_name)
SELECT 
    id,
    CASE 
        WHEN email = 'diego.carrillo@fadedskies.com' THEN 'admin'
        WHEN email IN ('testdriver@example.com', 'cydiatools32@gmail.com') THEN 'driver'
        ELSE 'customer'
    END
FROM users
ON CONFLICT DO NOTHING;

-- Create user_types table for better type management
CREATE TABLE IF NOT EXISTS user_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert user types
INSERT INTO user_types (type_name, description) VALUES
    ('admin', 'Administrator with full system access'),
    ('driver', 'Delivery driver with order management access'),
    ('customer', 'Regular customer with ordering access')
ON CONFLICT (type_name) DO NOTHING;

-- Show current user classification
SELECT 
    id,
    email,
    name,
    role,
    user_type,
    is_admin,
    is_driver,
    created_at
FROM users
ORDER BY created_at DESC;


