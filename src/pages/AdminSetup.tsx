import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminUser();
  }, []);

  const checkAdminUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'admin@gmail.com')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin user:', error);
        setAdminExists(false);
      } else {
        setAdminExists(!!data);
      }
    } catch (error) {
      console.error('Error checking admin user:', error);
      setAdminExists(false);
    }
  };

  const createAdminUser = async () => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'dadhaniyasamarth@gmail.com',
        password: 'Admin@123',
        options: {
          data: {
            full_name: 'Admin User',
            role: 'admin'
          }
        }
      });

      if (authError) {
        throw authError;
      }

      toast({
        title: "Admin User Created",
        description: "Admin user has been created successfully. You can now log in with admin@gmail.com / Admin@123",
      });

      await checkAdminUser();
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Admin Setup</CardTitle>
          <p className="text-muted-foreground">
            Set up the admin user for the Root-to-Market platform
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminExists === null ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : adminExists ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Admin User Exists</h3>
              <p className="text-muted-foreground mb-4">
                The admin user has already been created.
              </p>
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p className="font-medium mb-2">Admin Credentials:</p>
                <p><strong>Email:</strong> admin@gmail.com</p>
                <p><strong>Password:</strong> Admin@123</p>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => window.location.href = '/auth'}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Admin User</h3>
              <p className="text-muted-foreground mb-4">
                Create the default admin user to access the admin panel.
              </p>
              <div className="bg-muted p-4 rounded-lg text-sm mb-4">
                <p className="font-medium mb-2">Default Credentials:</p>
                <p><strong>Email:</strong> admin@gmail.com</p>
                <p><strong>Password:</strong> Admin@123</p>
              </div>
              <Button 
                className="w-full" 
                onClick={createAdminUser}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Admin User'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
