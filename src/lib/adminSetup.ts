import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@gmail.com')
      .single();

    if (existingAdmin) {
      console.log('Admin user already exists');
      return { success: true, message: 'Admin user already exists' };
    }

    // Create admin user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@gmail.com',
      password: 'Admin@123',
      options: {
        data: {
          full_name: 'Admin User',
          role: 'admin'
        }
      }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return { success: false, error: authError.message };
    }

    console.log('Admin user created successfully');
    return { success: true, message: 'Admin user created successfully' };
  } catch (error: any) {
    console.error('Error in createAdminUser:', error);
    return { success: false, error: error.message };
  }
};

// Function to check if admin user exists
export const checkAdminUser = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@gmail.com')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }

    return { exists: !!data, profile: data };
  } catch (error: any) {
    console.error('Error checking admin user:', error);
    return { exists: false, profile: null, error: error.message };
  }
};
