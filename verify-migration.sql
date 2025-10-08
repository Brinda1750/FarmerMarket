-- VERIFICATION SCRIPT - Run this in Supabase SQL Editor to check if migration was applied

-- Check if the enum exists
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'seller_item_status';

-- Check if the columns exist in order_items table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
AND column_name IN ('seller_status', 'received_confirmed', 'received_at')
ORDER BY column_name;

-- Check if the index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'order_items' 
AND indexname = 'idx_order_items_store_status';

-- Test inserting a record with the new columns (this will fail if columns don't exist)
-- Uncomment the lines below to test:
/*
INSERT INTO order_items (order_id, product_id, store_id, quantity, price, total, seller_status)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 1, 10.00, 10.00, 'pending');
*/
