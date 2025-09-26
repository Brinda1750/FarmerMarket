# Admin Panel Setup Guide

## Overview
The Root-to-Market platform includes a comprehensive admin panel with user management, store management, and analytics features.

## Admin Panel Features

### 1. User Management
- **View Users**: See all registered users with their details
- **Delete Users**: Remove users and their associated data
- **Activate/Deactivate**: Control user access to the platform
- **Search & Filter**: Find users quickly with search functionality

### 2. Store Management
- **View All Stores**: See all registered stores regardless of status
- **Approve Stores**: Change store status from pending to active
- **Activate/Deactivate**: Control store visibility on the platform
- **Store Details**: View seller information and product counts

### 3. Analytics Dashboard
- **User Growth**: Track user registration over time
- **Store Statistics**: Monitor store status distribution
- **Product Analytics**: View products by category
- **Revenue Tracking**: Monitor orders and revenue
- **Top Performing Stores**: Identify best-performing stores

## Setup Instructions

### 1. Create Admin User
1. Navigate to `/admin-setup` in your browser
2. Click "Create Admin User" button
3. The system will create the default admin user

### 2. Admin Login Credentials
- **Email**: `admin@gmail.com`
- **Password**: `Admin@123`

### 3. Access Admin Panel
1. Go to `/auth` and log in with the admin credentials
2. You will be automatically redirected to `/admin`
3. The admin panel will load with all management features

## Database Migrations
The following migrations are required:
1. `20250124000000_fix_store_visibility.sql` - Fix store visibility issues
2. `20250124000001_setup_storage.sql` - Setup file storage for images
3. `20250124000002_create_admin_user.sql` - Admin user creation logic
4. `20250124000003_admin_permissions.sql` - Admin access permissions

## Admin Panel Routes
- `/admin` - Main admin dashboard
- `/admin-setup` - Admin user creation page

## Security Features
- **Role-based Access**: Only users with `admin` role can access admin features
- **RLS Policies**: Database-level security ensures admin access to all data
- **Authentication**: Secure login with automatic role-based redirects

## Store Management Features
When a store is deactivated:
- Store is hidden from the main website
- All products from that store are hidden from the products page
- Store remains accessible to admin for reactivation

## Analytics Data
All analytics use real data from the database:
- User registration trends
- Store performance metrics
- Product category distributions
- Revenue and order tracking
- No dummy data is used

## Troubleshooting

### Admin User Not Created
1. Check if the admin user already exists at `/admin-setup`
2. Ensure database migrations have been run
3. Check browser console for any errors

### Cannot Access Admin Panel
1. Verify you're logged in with `admin@gmail.com`
2. Check that your profile has `role: 'admin'`
3. Ensure you're accessing `/admin` route

### Store Deactivation Not Working
1. Check database RLS policies
2. Verify store status is being updated
3. Clear browser cache and refresh

## Support
For technical issues, check:
1. Browser console for JavaScript errors
2. Network tab for API request failures
3. Database logs for RLS policy violations
