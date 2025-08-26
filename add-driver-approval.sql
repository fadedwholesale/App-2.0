-- Add approval status to drivers table
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add approval timestamp
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add approved_by field
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Update existing drivers to be approved (for testing)
UPDATE public.drivers 
SET is_approved = true, approved_at = NOW() 
WHERE is_approved IS NULL;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'drivers' 
AND table_schema = 'public'
ORDER BY ordinal_position;


