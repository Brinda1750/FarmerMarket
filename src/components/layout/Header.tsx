import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Leaf, 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  LogOut, 
  Store,
  Settings,
  Package,
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile, signOut } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboardPage = location.pathname.includes('dashboard') || location.pathname === '/admin';
  
  useEffect(() => {
    const loadCount = async () => {
      if (!profile) { setCartCount(0); return; }
      const { count } = await supabase
        .from('cart')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      setCartCount(count || 0);
    };
    loadCount();

    const channel = supabase
      .channel('cart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart', filter: `user_id=eq.${profile?.id}` }, loadCount)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
      case 'admin':
        return '/admin';
      case 'seller':
        return '/seller-dashboard';
      case 'user':
        return '/user-dashboard';
      default:
        return '/';
    }
  };

  const getDashboardButtonText = () => {
    if (!profile) return 'Dashboard';
    
    if (isDashboardPage) {
      return 'View Website';
    }
    
    switch (profile.role) {
      case 'admin':
        return 'Admin Panel';
      case 'seller':
        return 'Dashboard';
      case 'user':
        return 'Dashboard';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-primary rounded-full p-2">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">FarmerMarket</span>
        </Link>

        {/* Center Navigation - only show on main website, not on dashboards */}
        {!isDashboardPage && (
          <nav className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/products">Products</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/stores">Stores</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/about">About</Link>
            </Button>
          </nav>
        )}

        {/* Right Navigation */}
        <nav className="flex items-center space-x-2">
          
          {user ? (
            <>
              {/* Cart & Wishlist - only show on main website for users */}
              {!isDashboardPage && profile?.role === 'user' && (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/cart" className="relative">
                      <ShoppingCart className="w-5 h-5" />
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {cartCount}
                      </Badge>
                    </Link>
                  </Button>

                  {/* <Button variant="ghost" size="sm" asChild>
                    <Link to="/wishlist" className="relative">
                      <Heart className="w-5 h-5" />
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        0
                      </Badge>
                    </Link>
                  </Button> */}
                </>
              )}

              {/* Dashboard/Website Toggle Button */}
              {profile && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={isDashboardPage ? '/' : getDashboardLink()}>
                    {isDashboardPage ? (
                      <>
                        <Home className="w-4 h-4 mr-2" />
                        View Website
                      </>
                    ) : (
                      <>
                        {profile.role === 'admin' ? <Settings className="w-4 h-4 mr-2" /> : 
                         profile.role === 'seller' ? <Store className="w-4 h-4 mr-2" /> : 
                         <User className="w-4 h-4 mr-2" />}
                        {getDashboardButtonText()}
                      </>
                    )}
                  </Link>
                </Button>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <User className="w-5 h-5" />
                    <span className="ml-2 hidden md:block">
                      {profile?.full_name || 'Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name || 'User'}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {profile?.email}
                      </p>
                      <Badge variant={profile?.role === 'admin' ? 'destructive' : 'secondary'} className="w-fit">
                        {profile?.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;