// Test database connection and schema
import { supabase } from '@/integrations/supabase/client';

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    
    // Test if order_items table has the new columns
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id, seller_status, received_confirmed, received_at')
      .limit(1);
    
    if (orderItemsError) {
      console.error('Order items schema error:', orderItemsError);
      console.log('Migration may not be applied yet');
      return false;
    }
    
    console.log('Order items schema is correct - migration applied successfully!');
    
    // Test if we can query orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, status')
      .limit(5);
    
    if (ordersError) {
      console.error('Orders query error:', ordersError);
      return false;
    }
    
    console.log('Found orders:', orders?.length || 0);
    
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
};

// Call this function to test the database
// testDatabaseConnection();
