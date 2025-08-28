-- Create secure payment methods table with automatic card management
-- This table stores payment methods securely with Row Level Security (RLS)
-- and automatic card replacement/cleanup

-- Create the payment_methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('card', 'paypal', 'apple_pay', 'google_pay', 'fs_coin')),
    masked_details TEXT, -- Only store masked/hashed card numbers
    icon TEXT DEFAULT '💳',
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),
    is_primary BOOLEAN DEFAULT FALSE,
    card_last_four TEXT, -- Store last 4 digits for easy reference
    card_brand TEXT, -- Visa, Mastercard, etc.
    expiry_month TEXT, -- MM format
    expiry_year TEXT, -- YYYY format
    cardholder_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_primary ON public.payment_methods(user_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_methods_status ON public.payment_methods(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON public.payment_methods(user_id, payment_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for secure access

-- Policy: Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON public.payment_methods
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own payment methods
CREATE POLICY "Users can insert own payment methods" ON public.payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own payment methods
CREATE POLICY "Users can update own payment methods" ON public.payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own payment methods
CREATE POLICY "Users can delete own payment methods" ON public.payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_methods_updated_at();

-- Create function to ensure only one primary payment method per user
CREATE OR REPLACE FUNCTION ensure_single_primary_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a new primary payment method, remove primary from others
    IF NEW.is_primary = TRUE THEN
        UPDATE public.payment_methods 
        SET is_primary = FALSE, updated_at = NOW()
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure single primary payment method
CREATE TRIGGER ensure_single_primary_payment_method_trigger
    BEFORE INSERT OR UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_payment_method();

-- Create function to automatically manage card replacement
CREATE OR REPLACE FUNCTION auto_manage_card_replacement()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting a new card, automatically deactivate old cards of the same type
    IF NEW.payment_type = 'card' THEN
        UPDATE public.payment_methods 
        SET status = 'Inactive', updated_at = NOW()
        WHERE user_id = NEW.user_id 
        AND payment_type = 'card' 
        AND id != NEW.id
        AND status = 'Active';
        
        -- Set the new card as primary if no other primary exists
        IF NOT EXISTS (
            SELECT 1 FROM public.payment_methods 
            WHERE user_id = NEW.user_id AND is_primary = TRUE
        ) THEN
            NEW.is_primary = TRUE;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic card replacement
CREATE TRIGGER auto_manage_card_replacement_trigger
    BEFORE INSERT ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION auto_manage_card_replacement();

-- Create function to automatically clean up expired cards
CREATE OR REPLACE FUNCTION cleanup_expired_cards()
RETURNS void AS $$
BEGIN
    -- Mark cards as expired if they're past their expiry date
    UPDATE public.payment_methods 
    SET status = 'Expired', updated_at = NOW()
    WHERE payment_type = 'card'
    AND status = 'Active'
    AND expiry_year IS NOT NULL
    AND expiry_month IS NOT NULL
    AND (
        (expiry_year::integer < EXTRACT(YEAR FROM NOW())) OR
        (expiry_year::integer = EXTRACT(YEAR FROM NOW()) AND expiry_month::integer < EXTRACT(MONTH FROM NOW()))
    );
    
    -- Remove primary status from expired cards
    UPDATE public.payment_methods 
    SET is_primary = FALSE, updated_at = NOW()
    WHERE status = 'Expired' AND is_primary = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's payment methods with automatic cleanup
CREATE OR REPLACE FUNCTION get_user_payment_methods_clean(user_uuid UUID)
RETURNS TABLE (
    id BIGINT,
    payment_type TEXT,
    masked_details TEXT,
    icon TEXT,
    status TEXT,
    is_primary BOOLEAN,
    card_last_four TEXT,
    card_brand TEXT,
    expiry_month TEXT,
    expiry_year TEXT,
    cardholder_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check if user is authenticated and requesting their own data
    IF auth.uid() != user_uuid THEN
        RAISE EXCEPTION 'Access denied: Users can only access their own payment methods';
    END IF;
    
    -- Clean up expired cards first
    PERFORM cleanup_expired_cards();
    
    RETURN QUERY
    SELECT 
        pm.id,
        pm.payment_type,
        pm.masked_details,
        pm.icon,
        pm.status,
        pm.is_primary,
        pm.card_last_four,
        pm.card_brand,
        pm.expiry_month,
        pm.expiry_year,
        pm.cardholder_name,
        pm.created_at
    FROM public.payment_methods pm
    WHERE pm.user_id = user_uuid
    ORDER BY pm.is_primary DESC, pm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's payment methods with automatic UUID and cleanup
CREATE OR REPLACE FUNCTION get_user_payment_methods_auto()
RETURNS TABLE (
    id BIGINT,
    payment_type TEXT,
    masked_details TEXT,
    icon TEXT,
    status TEXT,
    is_primary BOOLEAN,
    card_last_four TEXT,
    card_brand TEXT,
    expiry_month TEXT,
    expiry_year TEXT,
    cardholder_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get current authenticated user's UUID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to access payment methods';
    END IF;
    
    -- Clean up expired cards first
    PERFORM cleanup_expired_cards();
    
    RETURN QUERY
    SELECT 
        pm.id,
        pm.payment_type,
        pm.masked_details,
        pm.icon,
        pm.status,
        pm.is_primary,
        pm.card_last_four,
        pm.card_brand,
        pm.expiry_month,
        pm.expiry_year,
        pm.cardholder_name,
        pm.created_at
    FROM public.payment_methods pm
    WHERE pm.user_id = v_user_id
    ORDER BY pm.is_primary DESC, pm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add/update card with automatic management
CREATE OR REPLACE FUNCTION add_or_update_card(
    p_user_id UUID,
    p_card_number TEXT,
    p_expiry_month TEXT,
    p_expiry_year TEXT,
    p_cvv TEXT,
    p_cardholder_name TEXT
)
RETURNS BIGINT AS $$
DECLARE
    v_last_four TEXT;
    v_card_brand TEXT;
    v_masked_details TEXT;
    v_card_id BIGINT;
BEGIN
    -- Extract last 4 digits
    v_last_four := RIGHT(p_card_number, 4);
    
    -- Determine card brand based on first digit
    v_card_brand := CASE 
        WHEN LEFT(p_card_number, 1) = '4' THEN 'Visa'
        WHEN LEFT(p_card_number, 2) IN ('51', '52', '53', '54', '55') THEN 'Mastercard'
        WHEN LEFT(p_card_number, 2) IN ('34', '37') THEN 'American Express'
        WHEN LEFT(p_card_number, 2) IN ('36', '38', '39') THEN 'Diners Club'
        WHEN LEFT(p_card_number, 4) = '6011' THEN 'Discover'
        ELSE 'Unknown'
    END;
    
    -- Create masked details
    v_masked_details := '**** **** **** ' || v_last_four;
    
    -- Deactivate existing cards
    UPDATE public.payment_methods 
    SET status = 'Inactive', updated_at = NOW()
    WHERE user_id = p_user_id AND payment_type = 'card' AND status = 'Active';
    
    -- Insert new card
    INSERT INTO public.payment_methods (
        user_id, 
        payment_type, 
        masked_details, 
        icon, 
        status, 
        is_primary,
        card_last_four,
        card_brand,
        expiry_month,
        expiry_year,
        cardholder_name
    ) VALUES (
        p_user_id,
        'card',
        v_masked_details,
        '💳',
        'Active',
        TRUE, -- Set as primary since we deactivated others
        v_last_four,
        v_card_brand,
        p_expiry_month,
        p_expiry_year,
        p_cardholder_name
    ) RETURNING id INTO v_card_id;
    
    RETURN v_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add/update card with automatic UUID (for authenticated users)
CREATE OR REPLACE FUNCTION add_or_update_card_auto(
    p_card_number TEXT,
    p_expiry_month TEXT,
    p_expiry_year TEXT,
    p_cvv TEXT,
    p_cardholder_name TEXT
)
RETURNS BIGINT AS $$
DECLARE
    v_user_id UUID;
    v_last_four TEXT;
    v_card_brand TEXT;
    v_masked_details TEXT;
    v_card_id BIGINT;
BEGIN
    -- Get current authenticated user's UUID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to add payment methods';
    END IF;
    
    -- Extract last 4 digits
    v_last_four := RIGHT(p_card_number, 4);
    
    -- Determine card brand based on first digit
    v_card_brand := CASE 
        WHEN LEFT(p_card_number, 1) = '4' THEN 'Visa'
        WHEN LEFT(p_card_number, 2) IN ('51', '52', '53', '54', '55') THEN 'Mastercard'
        WHEN LEFT(p_card_number, 2) IN ('34', '37') THEN 'American Express'
        WHEN LEFT(p_card_number, 2) IN ('36', '38', '39') THEN 'Diners Club'
        WHEN LEFT(p_card_number, 4) = '6011' THEN 'Discover'
        ELSE 'Unknown'
    END;
    
    -- Create masked details
    v_masked_details := '**** **** **** ' || v_last_four;
    
    -- Deactivate existing cards for this user
    UPDATE public.payment_methods 
    SET status = 'Inactive', updated_at = NOW()
    WHERE user_id = v_user_id AND payment_type = 'card' AND status = 'Active';
    
    -- Insert new card
    INSERT INTO public.payment_methods (
        user_id, 
        payment_type, 
        masked_details, 
        icon, 
        status, 
        is_primary,
        card_last_four,
        card_brand,
        expiry_month,
        expiry_year,
        cardholder_name
    ) VALUES (
        v_user_id,
        'card',
        v_masked_details,
        '💳',
        'Active',
        TRUE, -- Set as primary since we deactivated others
        v_last_four,
        v_card_brand,
        p_expiry_month,
        p_expiry_year,
        p_cardholder_name
    ) RETURNING id INTO v_card_id;
    
    RETURN v_card_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to add payment method with automatic UUID (for authenticated users)
CREATE OR REPLACE FUNCTION add_payment_method_auto(
    p_payment_type TEXT,
    p_masked_details TEXT,
    p_icon TEXT DEFAULT '💳',
    p_is_primary BOOLEAN DEFAULT FALSE
)
RETURNS BIGINT AS $$
DECLARE
    v_user_id UUID;
    v_payment_id BIGINT;
BEGIN
    -- Get current authenticated user's UUID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to add payment methods';
    END IF;
    
    -- If setting as primary, remove primary from other payment methods
    IF p_is_primary THEN
        UPDATE public.payment_methods 
        SET is_primary = FALSE, updated_at = NOW()
        WHERE user_id = v_user_id;
    END IF;
    
    -- Insert new payment method
    INSERT INTO public.payment_methods (
        user_id,
        payment_type,
        masked_details,
        icon,
        status,
        is_primary
    ) VALUES (
        v_user_id,
        p_payment_type,
        p_masked_details,
        p_icon,
        'Active',
        p_is_primary
    ) RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically add default payment methods for new users
CREATE OR REPLACE FUNCTION add_default_payment_methods(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Add Apple Pay as primary
    INSERT INTO public.payment_methods (user_id, payment_type, masked_details, icon, status, is_primary) VALUES
    (p_user_id, 'apple_pay', 'Apple Pay', '🍎', 'Active', TRUE);
    
    -- Add FS Coins
    INSERT INTO public.payment_methods (user_id, payment_type, masked_details, icon, status, is_primary) VALUES
    (p_user_id, 'fs_coin', 'Available', '🪙', 'Active', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.payment_methods TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.payment_methods_id_seq TO authenticated;

-- Create a scheduled job to clean up expired cards (runs daily)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-expired-cards', '0 2 * * *', 'SELECT cleanup_expired_cards();');

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO public.payment_methods (user_id, payment_type, masked_details, icon, status, is_primary, card_last_four, card_brand) VALUES
-- ('your-user-uuid-here', 'card', '**** **** **** 4242', '💳', 'Active', TRUE, '4242', 'Visa');

-- Verify the setup
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'payment_methods';

-- Show RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payment_methods';
