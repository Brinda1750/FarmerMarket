import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Mail, Lock, User, Eye, EyeOff, Shield } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'seller'>('user');
  const [loginMode, setLoginMode] = useState<'user' | 'seller' | 'admin'>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Remove redirect logic since it's now handled in AuthContext
  useEffect(() => {
    // This effect is no longer needed as redirects are handled in AuthContext
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Auto-fill admin credentials when admin mode is selected
  useEffect(() => {
    if (loginMode === 'admin') {
      setFormData(prev => ({
        ...prev,
        email: 'admin@gmail.com',
        password: 'Admin@123'
      }));
    }
  }, [loginMode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Handle admin login validation
    if (loginMode === 'admin') {
      if (formData.email !== 'admin@gmail.com' || formData.password !== 'Admin@123') {
        toast({
          title: "Invalid Admin Credentials",
          description: "Please use the correct admin email and password.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signIn(formData.email, formData.password);
    
    if (!error) {
      // Redirect is handled by AuthContext
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, formData.fullName, userRole);
    
    if (!error) {
      // Redirect is handled by AuthContext after signup and signin
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">FarmerMarket</h1>
          <p className="text-muted-foreground">Connect directly with local farmers</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-3 mb-4">
                    <Label>Login as</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="loginMode"
                          value="user"
                          checked={loginMode === 'user'}
                          onChange={(e) => setLoginMode(e.target.value as 'user' | 'seller' | 'admin')}
                          className="w-4 h-4 text-primary"
                        />
                        <User className="w-4 h-4" />
                        <span className="text-sm">User</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="loginMode"
                          value="seller"
                          checked={loginMode === 'seller'}
                          onChange={(e) => setLoginMode(e.target.value as 'user' | 'seller' | 'admin')}
                          className="w-4 h-4 text-primary"
                        />
                        <User className="w-4 h-4" />
                        <span className="text-sm">Seller</span>
                      </label>
                      {/* <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="loginMode"
                          value="admin"
                          checked={loginMode === 'admin'}
                          onChange={(e) => setLoginMode(e.target.value as 'user' | 'seller' | 'admin')}
                          className="w-4 h-4 text-primary"
                        />
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">Admin</span>
                      </label> */}
                    </div>
                  </div>

                  {/* {loginMode === 'admin' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Admin Login Mode</span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Using default admin credentials
                      </p>
                    </div>
                  )} */}

                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        readOnly={loginMode === 'admin'}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10"
                        readOnly={loginMode === 'admin'}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
{/* 
                <Separator />
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Demo Admin Account:</p>
                  <p>Email: admin@gmail.com</p>
                  <p>Password: Admin@123</p>
                </div> */}
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-3 mb-4">
                    <Label>Sign up as</Label>
                    <div className="flex grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="signupRole"
                          value="user"
                          checked={userRole === 'user'}
                          onChange={(e) => setUserRole(e.target.value as 'user' | 'seller')}
                          className="w-4 h-4 text-primary"
                        />
                        <User className="w-4 h-4" />
                        <span className="text-sm">User</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md border hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="signupRole"
                          value="seller"
                          checked={userRole === 'seller'}
                          onChange={(e) => setUserRole(e.target.value as 'user' | 'seller')}
                          className="w-4 h-4 text-primary"
                        />
                        <User className="w-4 h-4" />
                        <span className="text-sm">Seller</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || formData.password !== formData.confirmPassword}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;