# Troubleshooting: Migration Not Working

## Step 1: Verify Migration Was Applied

Run this SQL in your Supabase SQL Editor to check if the migration was applied:

```sql
-- Check if the enum exists
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname = 'seller_item_status';

-- Check if the columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
AND column_name IN ('seller_status', 'received_confirmed', 'received_at')
ORDER BY column_name;
```

**Expected Results:**
- First query should show 4 rows with enum values: pending, approved, discarded, received
- Second query should show 3 rows with the new columns

## Step 2: If Migration Wasn't Applied

If the queries above return empty results, run this complete migration:

```sql
-- Create enum if not exists
DO $$
BEGIN
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

-- Create helpful index
CREATE INDEX IF NOT EXISTS idx_order_items_store_status ON public.order_items(store_id, seller_status);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

## Step 3: Clear Browser Cache

After applying the migration:
1. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Try the app again

## Step 4: Check Console Logs

Open browser developer tools (F12) and check the console for:
- "Order items schema is correct - migration applied successfully!" (success)
- "Order items schema error:" (migration not applied)

## Step 5: Test Database Connection

Click the "Test Database Connection" button in the seller orders page to verify the migration status.

## Common Issues

1. **Wrong Database**: Make sure you're applying the migration to the correct Supabase project
2. **Permission Issues**: Ensure you have admin access to the Supabase project
3. **Caching**: Browser or Supabase might be caching the old schema
4. **Partial Migration**: Some parts of the migration might have failed

## Still Not Working?

If you're still seeing the error after following these steps, please share:
1. The results of the verification queries
2. Any error messages from the Supabase SQL Editor
3. Browser console logs
