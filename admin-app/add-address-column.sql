-- Add address column to users table for production
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';

-- Update existing users with empty address if needed
UPDATE users SET address = '' WHERE address IS NULL;
