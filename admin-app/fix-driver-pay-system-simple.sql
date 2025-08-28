-- Fix Driver Pay System - Production Ready for 1000+ Drivers
-- Base Pay: $2.00, Mileage Rate: $0.70 per mile
-- This script handles missing columns gracefully

-- Add distance column to orders table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'distance') THEN
        ALTER TABLE orders ADD COLUMN distance DECIMAL(8,2) DEFAULT 5.0;
        COMMENT ON COLUMN orders.distance IS 'Delivery distance in miles for driver pay calculation';
    END IF;
END $$;

-- Add driver pay columns to orders table if not exists
DO $$ 
BEGIN
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

-- Create function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance_miles(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R DECIMAL := 3959; -- Earth's radius in miles
    dLat DECIMAL;
    dLng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := (lat2 - lat1) * PI() / 180;
    dLng := (lng2 - lng1) * PI() / 180;
    a := SIN(dLat / 2) * SIN(dLat / 2) +
         COS(lat1 * PI() / 180) * COS(lat2 * PI() / 180) *
         SIN(dLng / 2) * SIN(dLng / 2);
    c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
    RETURN ROUND(R * c * 100) / 100; -- Round to 2 decimal places
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate driver pay
CREATE OR REPLACE FUNCTION calculate_driver_pay(
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

-- Create function to update order driver pay with real distance calculation
CREATE OR REPLACE FUNCTION update_order_driver_pay(order_id UUID)
RETURNS VOID AS $$
DECLARE
    order_distance DECIMAL;
    order_tip DECIMAL;
    calculated_pay RECORD;
    delivery_lat DECIMAL;
    delivery_lng DECIMAL;
    driver_lat DECIMAL;
    driver_lng DECIMAL;
    driver_id UUID;
    tip_column_exists BOOLEAN;
BEGIN
    -- Check if tip column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tip'
    ) INTO tip_column_exists;
    
    -- Get order details (handle missing tip column)
    IF tip_column_exists THEN
        SELECT distance, tip, delivery_lat, delivery_lng, driver_id 
        INTO order_distance, order_tip, delivery_lat, delivery_lng, driver_id
        FROM orders WHERE id = order_id;
    ELSE
        SELECT distance, delivery_lat, delivery_lng, driver_id 
        INTO order_distance, delivery_lat, delivery_lng, driver_id
        FROM orders WHERE id = order_id;
        order_tip := 0.0; -- Default tip if column doesn't exist
    END IF;
    
    -- If we have delivery coordinates and driver is assigned, calculate real distance
    IF delivery_lat IS NOT NULL AND delivery_lng IS NOT NULL AND driver_id IS NOT NULL THEN
        -- Get driver's current location
        SELECT current_lat, current_lng INTO driver_lat, driver_lng
        FROM drivers WHERE id = driver_id;
        
        -- Calculate real distance if driver location is available
        IF driver_lat IS NOT NULL AND driver_lng IS NOT NULL THEN
            order_distance := calculate_distance_miles(driver_lat, driver_lng, delivery_lat, delivery_lng);
            RAISE NOTICE 'Real distance calculated for order %: % miles', order_id, order_distance;
        END IF;
    END IF;
    
    -- Calculate driver pay
    SELECT * INTO calculated_pay FROM calculate_driver_pay(order_distance, order_tip);
    
    -- Update order with calculated pay and distance
    UPDATE orders SET 
        distance = order_distance,
        driver_base_pay = calculated_pay.base_pay,
        driver_mileage_pay = calculated_pay.mileage_pay,
        driver_total_pay = calculated_pay.total_pay,
        updated_at = NOW()
    WHERE id = order_id;
    
    RAISE NOTICE 'Updated order % driver pay: Distance=% miles, Base=$%, Mileage=$%, Total=$%', 
        order_id, order_distance, calculated_pay.base_pay, calculated_pay.mileage_pay, calculated_pay.total_pay;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate driver pay when order is created/updated
CREATE OR REPLACE FUNCTION trigger_calculate_driver_pay()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate and update driver pay
    PERFORM update_order_driver_pay(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS calculate_driver_pay_trigger ON orders;

-- Create trigger
CREATE TRIGGER calculate_driver_pay_trigger
    AFTER INSERT OR UPDATE OF distance, delivery_lat, delivery_lng ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_driver_pay();

-- Update existing orders with calculated driver pay (handle missing tip column)
DO $$
DECLARE
    tip_column_exists BOOLEAN;
BEGIN
    -- Check if tip column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'tip'
    ) INTO tip_column_exists;
    
    IF tip_column_exists THEN
        UPDATE orders SET 
            driver_base_pay = 2.00,
            driver_mileage_pay = (COALESCE(distance, 5.0) * 0.70),
            driver_total_pay = (2.00 + (COALESCE(distance, 5.0) * 0.70) + COALESCE(tip, 0.0))
        WHERE driver_base_pay IS NULL OR driver_mileage_pay IS NULL OR driver_total_pay IS NULL;
    ELSE
        UPDATE orders SET 
            driver_base_pay = 2.00,
            driver_mileage_pay = (COALESCE(distance, 5.0) * 0.70),
            driver_total_pay = (2.00 + (COALESCE(distance, 5.0) * 0.70))
        WHERE driver_base_pay IS NULL OR driver_mileage_pay IS NULL OR driver_total_pay IS NULL;
    END IF;
END $$;

-- Create index for efficient driver pay queries
CREATE INDEX IF NOT EXISTS idx_orders_driver_pay ON orders(driver_total_pay, status, driver_id);

-- Create view for driver earnings summary
CREATE OR REPLACE VIEW driver_earnings_summary AS
SELECT 
    d.id as driver_id,
    d.name as driver_name,
    COUNT(o.id) as total_orders,
    SUM(o.driver_total_pay) as total_earnings,
    SUM(o.driver_base_pay) as total_base_pay,
    SUM(o.driver_mileage_pay) as total_mileage_pay,
    SUM(COALESCE(o.tip, 0)) as total_tips,
    SUM(o.distance) as total_miles,
    AVG(o.driver_total_pay) as avg_order_pay
FROM drivers d
LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered'
GROUP BY d.id, d.name;

-- Grant permissions for the view
GRANT SELECT ON driver_earnings_summary TO authenticated;

-- Create RLS policy for driver earnings view
CREATE POLICY "Drivers can view their own earnings" ON driver_earnings_summary
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM drivers WHERE id = driver_id
        )
    );

-- Success message
SELECT 'Driver pay system updated successfully!' as status;



