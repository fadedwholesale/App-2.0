-- Create Earnings Table and Pay System for 1000+ Users
-- Legal compliance and accurate tracking
-- Base Pay: $2.00, Mileage Rate: $0.70 per mile

-- ===========================================
-- 1. ENSURE EARNINGS TABLE EXISTS
-- ===========================================

-- Create earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS earnings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    driver_id BIGINT NOT NULL, -- Changed to BIGINT to match drivers.id
    order_id BIGINT, -- Changed to BIGINT to match orders.id
    type TEXT NOT NULL CHECK (type IN ('BASE_PAY', 'MILEAGE', 'TIP', 'BONUS')),
    amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_earnings_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    CONSTRAINT fk_earnings_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Create indexes for earnings table
CREATE INDEX IF NOT EXISTS idx_earnings_driver_id ON earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_earnings_order_id ON earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON earnings(date);
CREATE INDEX IF NOT EXISTS idx_earnings_type ON earnings(type);
CREATE INDEX IF NOT EXISTS idx_earnings_is_paid ON earnings(is_paid);

-- ===========================================
-- 2. ENSURE DRIVER EARNINGS FIELDS EXIST
-- ===========================================

-- Add earnings fields to drivers table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'total_earnings') THEN
        ALTER TABLE drivers ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN drivers.total_earnings IS 'Total earnings for driver';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'weekly_earnings') THEN
        ALTER TABLE drivers ADD COLUMN weekly_earnings DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN drivers.weekly_earnings IS 'Weekly earnings for driver';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'monthly_earnings') THEN
        ALTER TABLE drivers ADD COLUMN monthly_earnings DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN drivers.monthly_earnings IS 'Monthly earnings for driver';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'pending_earnings') THEN
        ALTER TABLE drivers ADD COLUMN pending_earnings DECIMAL(10,2) DEFAULT 0.00;
        COMMENT ON COLUMN drivers.pending_earnings IS 'Pending earnings for driver';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'total_deliveries') THEN
        ALTER TABLE drivers ADD COLUMN total_deliveries INTEGER DEFAULT 0;
        COMMENT ON COLUMN drivers.total_deliveries IS 'Total deliveries completed by driver';
    END IF;
END $$;

-- ===========================================
-- 3. ADD PAY FIELDS TO ORDERS TABLE
-- ===========================================

-- Add pay calculation fields to orders table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tip') THEN
        ALTER TABLE orders ADD COLUMN tip DECIMAL(8,2) DEFAULT 0.00;
        COMMENT ON COLUMN orders.tip IS 'Customer tip amount';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'distance') THEN
        ALTER TABLE orders ADD COLUMN distance DECIMAL(8,2) DEFAULT 5.0;
        COMMENT ON COLUMN orders.distance IS 'Delivery distance in miles for driver pay calculation';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'driver_base_pay') THEN
        ALTER TABLE orders ADD COLUMN driver_base_pay DECIMAL(8,2) DEFAULT 2.00;
        COMMENT ON COLUMN orders.driver_base_pay IS 'Driver base pay for this order ($2.00)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'driver_mileage_pay') THEN
        ALTER TABLE orders ADD COLUMN driver_mileage_pay DECIMAL(8,2) DEFAULT 0.00;
        COMMENT ON COLUMN orders.driver_mileage_pay IS 'Driver mileage pay for this order ($0.70 per mile)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'driver_total_pay') THEN
        ALTER TABLE orders ADD COLUMN driver_total_pay DECIMAL(8,2) DEFAULT 0.00;
        COMMENT ON COLUMN orders.driver_total_pay IS 'Total driver pay for this order (base + mileage + tip)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivered_at') THEN
        ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN orders.delivered_at IS 'Timestamp when order was delivered';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        ALTER TABLE orders ADD COLUMN order_number TEXT;
        COMMENT ON COLUMN orders.order_number IS 'Unique order number for tracking';
    END IF;
END $$;

-- ===========================================
-- 4. SCALABLE FUNCTIONS
-- ===========================================

-- High-performance distance calculation function
CREATE OR REPLACE FUNCTION calculate_distance_miles_optimized(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 3959;
    dLat DECIMAL;
    dLng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Optimized calculation for high volume
    dLat := RADIANS(lat2 - lat1);
    dLng := RADIANS(lng2 - lng1);
    a := SIN(dLat / 2) * SIN(dLat / 2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dLng / 2) * SIN(dLng / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    RETURN ROUND(R * c * 100) / 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Pay calculation function
CREATE OR REPLACE FUNCTION calculate_driver_pay_legal(
    order_distance DECIMAL DEFAULT 5.0,
    order_tip DECIMAL DEFAULT 0.0
) RETURNS TABLE(
    base_pay DECIMAL,
    mileage_pay DECIMAL,
    total_pay DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT 
        2.00 as base_pay,
        (order_distance * 0.70) as mileage_pay,
        (2.00 + (order_distance * 0.70) + order_tip) as total_pay;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 5. REAL-TIME PAY CALCULATION TRIGGER
-- ===========================================

-- Trigger function for real-time pay calculation with legal tracking
CREATE OR REPLACE FUNCTION trigger_calculate_real_time_pay_legal()
RETURNS TRIGGER AS $$
DECLARE
    driver_record RECORD;
    calculated_pay RECORD;
    delivery_distance DECIMAL;
    earnings_id TEXT;
BEGIN
    -- Only process when order is delivered and has driver
    IF NEW.status = 'delivered' AND NEW.driver_id IS NOT NULL THEN
        
        -- Get driver location from drivers table
        SELECT current_lat, current_lng INTO driver_record
        FROM drivers WHERE id = NEW.driver_id;
        
        -- Calculate real distance if coordinates available
        IF driver_record.current_lat IS NOT NULL AND driver_record.current_lng IS NOT NULL 
           AND NEW.delivery_lat IS NOT NULL AND NEW.delivery_lng IS NOT NULL THEN
            
            delivery_distance := calculate_distance_miles_optimized(
                driver_record.current_lat, driver_record.current_lng,
                NEW.delivery_lat, NEW.delivery_lng
            );
            
            -- Calculate pay
            SELECT * INTO calculated_pay FROM calculate_driver_pay_legal(
                delivery_distance,
                COALESCE(NEW.tip, 0.00)
            );
            
            -- Update order with calculated pay
            NEW.distance := delivery_distance;
            NEW.driver_base_pay := calculated_pay.base_pay;
            NEW.driver_mileage_pay := calculated_pay.mileage_pay;
            NEW.driver_total_pay := calculated_pay.total_pay;
            
            -- Create legal earnings records for tracking
            INSERT INTO earnings (driver_id, order_id, type, amount, date) 
            VALUES (NEW.driver_id::BIGINT, NEW.id::BIGINT, 'BASE_PAY', calculated_pay.base_pay, NOW())
            RETURNING id INTO earnings_id;
            
            INSERT INTO earnings (driver_id, order_id, type, amount, date) 
            VALUES (NEW.driver_id::BIGINT, NEW.id::BIGINT, 'MILEAGE', calculated_pay.mileage_pay, NOW());
            
            -- Add tip if exists
            IF COALESCE(NEW.tip, 0.00) > 0 THEN
                INSERT INTO earnings (driver_id, order_id, type, amount, date) 
                VALUES (NEW.driver_id::BIGINT, NEW.id::BIGINT, 'TIP', NEW.tip, NOW());
            END IF;
            
            -- Update driver's total earnings for legal compliance
            UPDATE drivers SET 
                total_earnings = total_earnings + calculated_pay.total_pay,
                pending_earnings = pending_earnings + calculated_pay.total_pay,
                total_deliveries = total_deliveries + 1,
                updated_at = NOW()
            WHERE id = NEW.driver_id;
            
            -- Log the earnings calculation for legal purposes
            RAISE NOTICE 'Legal earnings recorded for driver %: Order=%, Base=$%, Mileage=$%, Tip=$%, Total=$%', 
                NEW.driver_id, NEW.id, calculated_pay.base_pay, calculated_pay.mileage_pay, 
                COALESCE(NEW.tip, 0.00), calculated_pay.total_pay;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time pay calculation
DROP TRIGGER IF EXISTS calculate_real_time_pay_trigger ON orders;
CREATE TRIGGER calculate_real_time_pay_trigger
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_real_time_pay_legal();

-- ===========================================
-- 6. PERFORMANCE INDEXES
-- ===========================================

-- High-performance indexes for 1000+ users
CREATE INDEX IF NOT EXISTS idx_orders_driver_pay 
ON orders(driver_total_pay, status, driver_id);

CREATE INDEX IF NOT EXISTS idx_earnings_driver_date 
ON earnings(driver_id, date);

CREATE INDEX IF NOT EXISTS idx_earnings_type_amount 
ON earnings(type, amount);

CREATE INDEX IF NOT EXISTS idx_drivers_earnings 
ON drivers(total_earnings DESC, pending_earnings DESC);

-- ===========================================
-- 7. LEGAL COMPLIANCE VIEWS
-- ===========================================

-- Driver earnings summary view for legal reporting
CREATE OR REPLACE VIEW driver_earnings_legal_summary AS
SELECT 
    d.id as driver_id,
    d.user_id,
    u.name as driver_name,
    u.email as driver_email,
    COUNT(DISTINCT o.id) as total_deliveries,
    SUM(o.driver_total_pay) as total_earnings,
    SUM(o.driver_base_pay) as total_base_pay,
    SUM(o.driver_mileage_pay) as total_mileage_pay,
    SUM(o.tip) as total_tips,
    SUM(o.distance) as total_miles,
    AVG(o.driver_total_pay) as avg_order_pay,
    d.total_earnings as driver_total_earnings,
    d.pending_earnings as driver_pending_earnings,
    d.total_deliveries as driver_total_deliveries,
    MAX(o.delivered_at) as last_delivery_date,
    -- Legal compliance fields
    COUNT(e.id) as total_earnings_records,
    SUM(CASE WHEN e.is_paid = true THEN e.amount ELSE 0 END) as paid_earnings,
    SUM(CASE WHEN e.is_paid = false THEN e.amount ELSE 0 END) as unpaid_earnings
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN orders o ON d.id::TEXT = o.driver_id AND o.status = 'delivered'
LEFT JOIN earnings e ON d.id = e.driver_id
GROUP BY d.id, d.user_id, u.name, u.email, d.total_earnings, d.pending_earnings, d.total_deliveries;

-- Detailed earnings audit trail for legal purposes
CREATE OR REPLACE VIEW earnings_audit_trail AS
SELECT 
    e.id as earnings_id,
    e.driver_id,
    d.user_id,
    u.name as driver_name,
    e.order_id,
    o.order_number,
    e.type as earnings_type,
    e.amount,
    e.date as earnings_date,
    e.is_paid,
    e.created_at,
    o.delivered_at,
    o.distance,
    o.driver_base_pay,
    o.driver_mileage_pay,
    o.driver_total_pay,
    o.tip
FROM earnings e
JOIN drivers d ON e.driver_id = d.id
JOIN users u ON d.user_id = u.id
LEFT JOIN orders o ON e.order_id = o.id
ORDER BY e.date DESC, e.created_at DESC;

-- ===========================================
-- 8. SECURITY AND RLS POLICIES
-- ===========================================

-- Enable RLS on earnings table for legal compliance
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Driver can only see their own earnings
CREATE POLICY "Drivers can view own earnings" ON earnings
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM drivers WHERE id = driver_id::BIGINT
        )
    );

-- Admins can view all earnings for legal compliance (using users table with role check)
CREATE POLICY "Admins can view all earnings" ON earnings
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data::text LIKE '%"role":"admin"%'
        )
    );

-- ===========================================
-- 9. UPDATE EXISTING ORDERS
-- ===========================================

-- Update existing delivered orders with calculated pay
UPDATE orders SET 
    driver_base_pay = 2.00,
    driver_mileage_pay = (COALESCE(distance, 5.0) * 0.70),
    driver_total_pay = (2.00 + (COALESCE(distance, 5.0) * 0.70) + COALESCE(tip, 0.0))
WHERE status = 'delivered' 
AND (driver_base_pay IS NULL OR driver_mileage_pay IS NULL OR driver_total_pay IS NULL);

-- ===========================================
-- 10. SUCCESS MESSAGE
-- ===========================================

SELECT 'Earnings table and legal pay system for 1000+ users deployed successfully!' as status;
