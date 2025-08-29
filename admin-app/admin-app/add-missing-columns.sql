-- Add missing columns to products table
-- Run this in Supabase SQL Editor

-- Add description column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add image_url column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add featured column
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Update existing rows to have default values
UPDATE public.products 
SET description = '' WHERE description IS NULL;

UPDATE public.products 
SET featured = false WHERE featured IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;


