-- Create default admin user
-- This will be handled by the application, but we need to ensure the admin user exists

-- Update the handle_new_user function to properly handle admin role
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
        CASE 
            WHEN NEW.email = 'admin@gmail.com' THEN 'admin'::user_role
            ELSE COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user')
        END
    );
    RETURN NEW;
END;
$$;

-- Create admin user if it doesn't exist
-- Note: The actual user creation in auth.users will be handled by the application
-- This ensures the profile will be created correctly when the admin user signs up
