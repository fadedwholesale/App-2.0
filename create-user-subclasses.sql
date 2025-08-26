-- Add user role/subclass fields to users table
DO $$ BEGIN
    -- Add role field to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'customer';
        RAISE NOTICE 'Added role column to users table';
    ELSE
        RAISE NOTICE 'Role column already exists in users table';
    END IF;

    -- Add user_type field to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
        ALTER TABLE users ADD COLUMN user_type VARCHAR(50) DEFAULT 'customer';
        RAISE NOTICE 'Added user_type column to users table';
    ELSE
        RAISE NOTICE 'User_type column already exists in users table';
    END IF;

    -- Add is_admin field to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_admin column to users table';
    ELSE
        RAISE NOTICE 'Is_admin column already exists in users table';
    END IF;

    -- Add is_driver field to users table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_driver') THEN
        ALTER TABLE users ADD COLUMN is_driver BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_driver column to users table';
    ELSE
        RAISE NOTICE 'Is_driver column already exists in users table';
    END IF;

END $$;

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


