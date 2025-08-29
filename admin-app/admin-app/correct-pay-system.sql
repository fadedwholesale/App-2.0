-- Correct Pay System for 1000+ Users
-- Uses existing database schema without workarounds
-- Base Pay: $2.00, Mileage Rate: $0.70 per mile

-- ===========================================
-- 1. ADD PAY FIELDS TO EXISTING TABLES
-- ===========================================

-- Add pay calculation fields to orders table
DO $$ 
BEGIN
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
END $$;

-- ===========================================
-- 2. SCALABLE FUNCTIONS
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

-- Pay calculation function using correct schema
CREATE OR REPLACE FUNCTION calculate_driver_pay_correct(
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
-- 3. REAL-TIME PAY CALCULATION TRIGGER
-- ===========================================

-- Trigger function for real-time pay calculation using correct schema
CREATE OR REPLACE FUNCTION trigger_calculate_real_time_pay_correct()
RETURNS TRIGGER AS $$
DECLARE
    driver_record RECORD;
    calculated_pay RECORD;
    delivery_distance DECIMAL;
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
            SELECT * INTO calculated_pay FROM calculate_driver_pay_correct(
                delivery_distance,
                COALESCE(NEW.tip, 0.00)
            );
            
            -- Update order with calculated pay
            NEW.distance := delivery_distance;
            NEW.driver_base_pay := calculated_pay.base_pay;
            NEW.driver_mileage_pay := calculated_pay.mileage_pay;
            NEW.driver_total_pay := calculated_pay.total_pay;
            
            -- Create earnings record using existing earnings table
            INSERT INTO earnings (
                driver_id, order_id, type, amount, date
            ) VALUES 
            (NEW.driver_id, NEW.id, 'BASE_PAY', calculated_pay.base_pay, NOW()),
            (NEW.driver_id, NEW.id, 'MILEAGE', calculated_pay.mileage_pay, NOW());
            
            -- Add tip if exists
            IF COALESCE(NEW.tip, 0.00) > 0 THEN
                INSERT INTO earnings (
                    driver_id, order_id, type, amount, date
                ) VALUES (NEW.driver_id, NEW.id, 'TIP', NEW.tip, NOW());
            END IF;
            
            -- Update driver's total earnings
            UPDATE drivers SET 
                total_earnings = total_earnings + calculated_pay.total_pay,
                pending_earnings = pending_earnings + calculated_pay.total_pay,
                total_deliveries = total_deliveries + 1,
                updated_at = NOW()
            WHERE id = NEW.driver_id;
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
    EXECUTE FUNCTION trigger_calculate_real_time_pay_correct();

-- ===========================================
-- 4. PERFORMANCE INDEXES
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
-- 5. SCALABLE VIEWS FOR REPORTING
-- ===========================================

-- Driver earnings summary view using correct schema
CREATE OR REPLACE VIEW driver_earnings_summary_correct AS
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
    MAX(o.delivered_at) as last_delivery_date
FROM drivers d
JOIN users u ON d.user_id = u.id
LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered'
GROUP BY d.id, d.user_id, u.name, u.email, d.total_earnings, d.pending_earnings, d.total_deliveries;

-- Daily earnings aggregation view
CREATE OR REPLACE VIEW daily_earnings_aggregation_correct AS
SELECT 
    DATE(o.delivered_at) as delivery_date,
    COUNT(DISTINCT o.driver_id) as active_drivers,
    COUNT(*) as total_deliveries,
    SUM(o.driver_total_pay) as total_earnings,
    SUM(o.driver_base_pay) as total_base_pay,
    SUM(o.driver_mileage_pay) as total_mileage_pay,
    SUM(o.tip) as total_tips,
    SUM(o.distance) as total_miles,
    AVG(o.driver_total_pay) as avg_driver_earnings
FROM orders o
WHERE o.status = 'delivered' 
AND o.delivered_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(o.delivered_at)
ORDER BY delivery_date DESC;

-- ===========================================
-- 6. SECURITY AND RLS POLICIES
-- ===========================================

-- Enable RLS on earnings table
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Driver can only see their own earnings
CREATE POLICY "Drivers can view own earnings" ON earnings
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM drivers WHERE id = driver_id
        )
    );

-- Admins can view all earnings (using correct admins table)
CREATE POLICY "Admins can view all earnings" ON earnings
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM admins
        )
    );

-- ===========================================
-- 7. UPDATE EXISTING ORDERS
-- ===========================================

-- Update existing delivered orders with calculated pay
UPDATE orders SET 
    driver_base_pay = 2.00,
    driver_mileage_pay = (COALESCE(distance, 5.0) * 0.70),
    driver_total_pay = (2.00 + (COALESCE(distance, 5.0) * 0.70) + COALESCE(tip, 0.0))
WHERE status = 'delivered' 
AND (driver_base_pay IS NULL OR driver_mileage_pay IS NULL OR driver_total_pay IS NULL);

-- ===========================================
-- 8. SUCCESS MESSAGE
-- ===========================================

SELECT 'Correct pay system for 1000+ users deployed successfully!' as status;



