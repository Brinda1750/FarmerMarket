-- Fix security issues: Enable RLS on all public tables and create proper policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for stores table
CREATE POLICY "Anyone can view active stores" ON public.stores
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can view their own stores" ON public.stores
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can create stores" ON public.stores
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own stores" ON public.stores
    FOR UPDATE USING (auth.uid() = seller_id);

-- Create RLS policies for products table
CREATE POLICY "Anyone can view active products" ON public.products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can view their own products" ON public.products
    FOR SELECT USING (auth.uid() IN (SELECT seller_id FROM stores WHERE id = store_id));

CREATE POLICY "Sellers can create products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT seller_id FROM stores WHERE id = store_id));

CREATE POLICY "Sellers can update their own products" ON public.products
    FOR UPDATE USING (auth.uid() IN (SELECT seller_id FROM stores WHERE id = store_id));

-- Create RLS policies for categories (public read)
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (is_active = true);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for order_items
CREATE POLICY "Users can view their own order items" ON public.order_items
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM orders WHERE id = order_id));

CREATE POLICY "Users can create their own order items" ON public.order_items
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM orders WHERE id = order_id));

-- Create RLS policies for cart
CREATE POLICY "Users can view their own cart" ON public.cart
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart" ON public.cart
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for wishlist
CREATE POLICY "Users can view their own wishlist" ON public.wishlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlist" ON public.wishlist
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view product reviews" ON public.product_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create product reviews" ON public.product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product reviews" ON public.product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view store reviews" ON public.store_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can create store reviews" ON public.store_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store reviews" ON public.store_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;