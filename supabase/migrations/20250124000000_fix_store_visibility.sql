-- Fix store visibility issue by updating RLS policies
-- Allow viewing both active and pending stores

-- Update the RLS policy for stores to allow viewing both active and pending stores
DROP POLICY IF EXISTS "Anyone can view active stores" ON public.stores;

CREATE POLICY "Anyone can view active and pending stores" ON public.stores
    FOR SELECT USING (status IN ('active', 'pending'));

-- Ensure sellers can always view their own stores regardless of status
CREATE POLICY "Sellers can view their own stores regardless of status" ON public.stores
    FOR SELECT USING (auth.uid() = seller_id);

-- Update the products policy to allow viewing products from both active and pending stores
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

CREATE POLICY "Anyone can view products from active and pending stores" ON public.products
    FOR SELECT USING (
        status = 'active' AND 
        store_id IN (
            SELECT id FROM stores WHERE status IN ('active', 'pending')
        )
    );
