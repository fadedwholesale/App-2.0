-- Add current_order_id column to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_order_id BIGINT;

-- Add comment to the column
COMMENT ON COLUMN drivers.current_order_id IS 'ID of the order currently being delivered by this driver';



