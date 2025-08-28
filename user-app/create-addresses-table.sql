-- Production-ready addresses table creation
-- This script creates the addresses table with proper RLS policies and functions

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    label TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    country TEXT DEFAULT 'USA',
    phone TEXT,
    instructions TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON public.addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_addresses_user_active ON public.addresses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_addresses_user_default ON public.addresses(user_id, is_default);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_addresses_updated_at ON public.addresses;
CREATE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
    -- If this address is being set as default, unset all other defaults for this user
    IF NEW.is_default = true THEN
        UPDATE public.addresses 
        SET is_default = false 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for single default address
DROP TRIGGER IF EXISTS ensure_single_default_address_trigger ON public.addresses;
CREATE TRIGGER ensure_single_default_address_trigger
    BEFORE INSERT OR UPDATE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_address();

-- Create RLS policies
-- Policy for users to view their own addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses" ON public.addresses
    FOR SELECT USING (auth.jwt() ->> 'email' = user_id);

-- Policy for users to insert their own addresses
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses" ON public.addresses
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = user_id);

-- Policy for users to update their own addresses
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses" ON public.addresses
    FOR UPDATE USING (auth.jwt() ->> 'email' = user_id);

-- Policy for users to delete their own addresses
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses" ON public.addresses
    FOR DELETE USING (auth.jwt() ->> 'email' = user_id);

-- Create function to get user addresses with proper formatting
CREATE OR REPLACE FUNCTION get_user_addresses(user_email TEXT)
RETURNS TABLE (
    id UUID,
    user_id TEXT,
    label TEXT,
    street TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    phone TEXT,
    instructions TEXT,
    is_default BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    full_address TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.label,
        a.street,
        a.city,
        a.state,
        a.zip_code,
        a.country,
        a.phone,
        a.instructions,
        a.is_default,
        a.is_active,
        a.created_at,
        a.updated_at,
        a.street || ', ' || a.city || ', ' || a.state || ' ' || a.zip_code as full_address
    FROM public.addresses a
    WHERE a.user_id = user_email
    AND a.is_active = true
    ORDER BY a.is_default DESC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.addresses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_addresses(TEXT) TO anon, authenticated;

-- Insert some sample addresses for testing (optional)
-- INSERT INTO public.addresses (user_id, label, street, city, state, zip_code, is_default) 
-- VALUES 
-- ('test@example.com', 'Home', '123 Main St', 'Austin', 'TX', '78701', true),
-- ('test@example.com', 'Work', '456 Business Ave', 'Austin', 'TX', '78702', false);

COMMENT ON TABLE public.addresses IS 'User delivery addresses with RLS for data isolation';
COMMENT ON FUNCTION get_user_addresses(TEXT) IS 'Get formatted addresses for a specific user';
