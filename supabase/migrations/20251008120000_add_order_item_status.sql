-- Add seller-specific status and receipt confirmation to order_items
DO $$
BEGIN
    -- Create enum if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'seller_item_status'
    ) THEN
        CREATE TYPE public.seller_item_status AS ENUM ('pending', 'approved', 'discarded', 'received');
    END IF;
END $$;

ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS seller_status public.seller_item_status DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS received_confirmed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- Helpful index for seller dashboards
CREATE INDEX IF NOT EXISTS idx_order_items_store_status ON public.order_items(store_id, seller_status);


