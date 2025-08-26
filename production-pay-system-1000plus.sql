-- Production Pay System for 1000+ Users
-- Scalable, Optimized, and Production-Ready
-- Base Pay: $2.00, Mileage Rate: $0.70 per mile

-- ===========================================
-- 1. CORE PAY SYSTEM TABLES
-- ===========================================

-- Pay rates configuration table (for easy updates)
CREATE TABLE IF NOT EXISTS pay_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_type VARCHAR(50) NOT NULL UNIQUE,
    base_amount DECIMAL(10,2) NOT NULL,
    mileage_rate DECIMAL(10,2) NOT NULL,
    bonus_rate DECIMAL(10,2) DEFAULT 0.00,
    peak_hour_multiplier DECIMAL(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pay rates
INSERT INTO pay_rates (rate_type, base_amount, mileage_rate, bonus_rate) VALUES
('standard', 2.00, 0.70, 0.00),
('peak_hours', 2.00, 0.70, 1.00),
('weekend', 2.50, 0.75, 0.50),
('holiday', 3.00, 0.80, 1.00)
ON CONFLICT (rate_type) DO NOTHING;

-- Driver earnings tracking table (optimized for 1000+ drivers)
CREATE TABLE IF NOT EXISTS driver_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id BIGINT NOT NULL, -- Changed to BIGINT to match drivers.id
    order_id UUID,
    earnings_date DATE NOT NULL,
    base_pay DECIMAL(10,2) NOT NULL,
    mileage_pay DECIMAL(10,2) NOT NULL,
    tip_amount DECIMAL(10,2) DEFAULT 0.00,
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    total_earnings DECIMAL(10,2) NOT NULL,
    distance_miles DECIMAL(8,2) NOT NULL,
    delivery_time_minutes INTEGER,
    peak_hours BOOLEAN DEFAULT false,
    weekend_delivery BOOLEAN DEFAULT false,
    holiday_delivery BOOLEAN DEFAULT false,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- 2. PERFORMANCE OPTIMIZED INDEXES
-- ===========================================

-- High-performance indexes for 1000+ users
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_date 
ON driver_earnings(driver_id, earnings_date);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_date_status 
ON driver_earnings(earnings_date, payment_status);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_total 
ON driver_earnings(total_earnings DESC);

CREATE INDEX IF NOT EXISTS idx_pay_rates_active 
ON pay_rates(is_active, effective_date);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_driver_earnings_composite 
ON driver_earnings(driver_id, earnings_date, payment_status, total_earnings);

-- ===========================================
-- 3. SCALABLE FUNCTIONS
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

-- Scalable pay calculation function
CREATE OR REPLACE FUNCTION calculate_driver_pay_scalable(
    order_distance DECIMAL,
    order_tip DECIMAL DEFAULT 0.0,
    is_peak_hours BOOLEAN DEFAULT false,
    is_weekend BOOLEAN DEFAULT false,
    is_holiday BOOLEAN DEFAULT false
) RETURNS TABLE(
    base_pay DECIMAL,
    mileage_pay DECIMAL,
    tip_amount DECIMAL,
    bonus_amount DECIMAL,
    total_pay DECIMAL
) AS $$
DECLARE
    rate_record RECORD;
    rate_type VARCHAR(50);
BEGIN
    -- Determine rate type based on conditions
    IF is_holiday THEN
        rate_type := 'holiday';
    ELSIF is_weekend THEN
        rate_type := 'weekend';
    ELSIF is_peak_hours THEN
        rate_type := 'peak_hours';
    ELSE
        rate_type := 'standard';
    END IF;
    
    -- Get current pay rates
    SELECT * INTO rate_record FROM pay_rates 
    WHERE rate_type = rate_type AND is_active = true
    ORDER BY effective_date DESC LIMIT 1;
    
    -- Return calculated pay
    RETURN QUERY SELECT 
        rate_record.base_amount as base_pay,
        (order_distance * rate_record.mileage_rate) as mileage_pay,
        order_tip as tip_amount,
        rate_record.bonus_rate as bonus_amount,
        (rate_record.base_amount + (order_distance * rate_record.mileage_rate) + order_tip + rate_record.bonus_rate) as total_pay;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- 4. REAL-TIME PAY CALCULATION TRIGGERS
-- ===========================================

-- Trigger function for real-time pay calculation
CREATE OR REPLACE FUNCTION trigger_calculate_real_time_pay()
RETURNS TRIGGER AS $$
DECLARE
    driver_record RECORD;
    calculated_earnings RECORD;
    delivery_distance DECIMAL;
BEGIN
    -- Only process when order is delivered and has driver
    IF NEW.status = 'delivered' AND NEW.driver_id IS NOT NULL THEN
        
        -- Get driver location
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
            SELECT * INTO calculated_earnings FROM calculate_driver_pay_scalable(
                delivery_distance,
                COALESCE(NEW.tip, 0.00),
                EXTRACT(HOUR FROM NEW.delivered_at) BETWEEN 17 AND 20,
                EXTRACT(DOW FROM NEW.delivered_at) IN (0, 6),
                false
            );
            
            -- Update order with calculated pay
            NEW.distance := delivery_distance;
            NEW.driver_base_pay := calculated_earnings.base_pay;
            NEW.driver_mileage_pay := calculated_earnings.mileage_pay;
            NEW.driver_total_pay := calculated_earnings.total_pay;
            
            -- Insert earnings record
            INSERT INTO driver_earnings (
                driver_id, order_id, earnings_date, base_pay, mileage_pay,
                tip_amount, bonus_amount, total_earnings, distance_miles,
                delivery_time_minutes, peak_hours, weekend_delivery
            ) VALUES (
                NEW.driver_id::BIGINT, NEW.id, NEW.delivered_at::date,
                calculated_earnings.base_pay, calculated_earnings.mileage_pay,
                calculated_earnings.tip_amount, calculated_earnings.bonus_amount,
                calculated_earnings.total_pay, delivery_distance,
                EXTRACT(EPOCH FROM (NEW.delivered_at - NEW.created_at))/60,
                EXTRACT(HOUR FROM NEW.delivered_at) BETWEEN 17 AND 20,
                EXTRACT(DOW FROM NEW.delivered_at) IN (0, 6)
            ) ON CONFLICT (driver_id, order_id) DO NOTHING;
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
    EXECUTE FUNCTION trigger_calculate_real_time_pay();

-- ===========================================
-- 5. SCALABLE VIEWS FOR REPORTING
-- ===========================================

-- Driver earnings summary view (optimized for 1000+ drivers)
CREATE OR REPLACE VIEW driver_earnings_summary_scalable AS
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.email as driver_email,
    COUNT(de.id) as total_deliveries,
    SUM(de.total_earnings) as total_earnings,
    SUM(de.base_pay) as total_base_pay,
    SUM(de.mileage_pay) as total_mileage_pay,
    SUM(de.tip_amount) as total_tips,
    SUM(de.bonus_amount) as total_bonuses,
    SUM(de.distance_miles) as total_miles,
    AVG(de.total_earnings) as avg_order_pay,
    AVG(de.delivery_time_minutes) as avg_delivery_time,
    COUNT(CASE WHEN de.peak_hours THEN 1 END) as peak_hour_deliveries,
    COUNT(CASE WHEN de.weekend_delivery THEN 1 END) as weekend_deliveries,
    MAX(de.earnings_date) as last_delivery_date
FROM drivers d
LEFT JOIN driver_earnings de ON d.id = de.driver_id
WHERE de.earnings_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.id, d.name, d.email;

-- ===========================================
-- 6. SECURITY AND RLS POLICIES
-- ===========================================

-- Enable RLS on all pay tables
ALTER TABLE driver_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_rates ENABLE ROW LEVEL SECURITY;

-- Driver can only see their own earnings
CREATE POLICY "Drivers can view own earnings" ON driver_earnings
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM drivers WHERE id = driver_id::BIGINT
        )
    );

-- Admins can view all earnings (using users table with role check)
CREATE POLICY "Admins can view all earnings" ON driver_earnings
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data::text LIKE '%"role":"admin"%'
        )
    );

-- Admins can manage pay rates (using users table with role check)
CREATE POLICY "Admins can manage pay rates" ON pay_rates
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE raw_user_meta_data::text LIKE '%"role":"admin"%'
        )
    );

-- ===========================================
-- 7. SUCCESS MESSAGE
-- ===========================================

SELECT 'Production pay system for 1000+ users deployed successfully!' as status;
