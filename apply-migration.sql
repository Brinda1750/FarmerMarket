-- Apply the seller_status migration to remote Supabase database
-- Run this in the Supabase SQL Editor

-- Create enum if not exists
DO $$
BEGIN
    -- Create enum if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'seller_item_status'
    ) THEN
        CREATE TYPE public.seller_item_status AS ENUM ('pending', 'approved', 'discarded', 'received');
    END IF;
END $$;

-- Add columns to order_items table
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS seller_status public.seller_item_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS received_confirmed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- Create helpful index for seller dashboards
CREATE INDEX IF NOT EXISTS idx_order_items_store_status ON public.order_items(store_id, seller_status);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
