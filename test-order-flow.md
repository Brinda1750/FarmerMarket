# Order Flow Testing Guide

## Current Issue
Orders are not displaying in the seller's dashboard after a user makes a purchase.

## Debugging Steps Added

1. **Checkout Process**: Added console logging to see if orders are created successfully
2. **Seller Orders Page**: Added debug info showing:
   - Store ID
   - Total rows found
   - User ID
3. **Order Status**: Changed from 'confirmed' to 'pending' in checkout

## To Test the Flow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Apply the database migration**:
   - If using Supabase local: `npx supabase db reset`
   - If using remote Supabase: Apply the migration manually

3. **Test the complete flow**:
   - Create a seller account and store
   - Add products to the store
   - Create a buyer account
   - Add products to cart and checkout
   - Check seller dashboard for new orders

## Expected Behavior

1. **After checkout**: Order appears in seller dashboard as "Pending"
2. **Seller approves**: User dashboard shows "Approved" 
3. **User clicks "Received"**: Seller dashboard shows "Received"

## Debug Information

The seller orders page now shows debug info including:
- Store ID
- Number of orders found
- User ID

Check browser console for additional logging.
