import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Star, MapPin, Phone, Mail, Package, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoreData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  rating: number;
  total_reviews: number;
  status: string;
  logo_url?: string;
  banner_url?: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  images: string[];
  rating: number;
  total_reviews: number;
  unit: string;
  status: string;
}

const StoreDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      loadStore();
    }
  }, [id]);

  const loadStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          products(*)
        `)
        .eq('id', id)
        .in('status', ['active', 'pending'])
        .single();

      if (error) throw error;

      setStore(data);
    } catch (error: any) {
      console.error('Error loading store:', error);
      toast({
        title: "Error",
        description: "Failed to load store details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading store details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Store not found</h1>
            <p className="text-muted-foreground mb-4">The store you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/stores">Back to Stores</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Store Header */}
        <div className="relative mb-8">
          {/* Banner */}
          <div className="h-64 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden">
            {store.banner_url ? (
              <img 
                src={store.banner_url} 
                alt={`${store.name} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-24 h-24 text-primary/50" />
              </div>
            )}
          </div>

          {/* Store Info Overlay */}
          <div className="absolute -bottom-8 left-8 right-8">
            <Card className="border-0 shadow-xl bg-card/95 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {store.logo_url ? (
                    <img 
                      src={store.logo_url} 
                      alt={store.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-background"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background">
                      <Package className="w-10 h-10 text-primary" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{store.name}</h1>
                      <Badge className="bg-green-500 text-white">Verified</Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4 max-w-2xl">
                      {store.description || 'Fresh organic produce from local farms'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {store.address}, {store.city}, {store.state} - {store.pincode}
                        </span>
                      </div>
                      
                      {store.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{store.phone}</span>
                        </div>
                      )}
                      
                      {store.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{store.email}</span>
                        </div>
                      )}
                    </div>

                    {store.rating > 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium text-yellow-700">{store.rating}</span>
                          <span className="text-yellow-600 text-sm">
                            ({store.total_reviews} reviews)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Products ({store.products?.length || 0})</h2>
          </div>

          {store.products && store.products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {store.products.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-card/80 backdrop-blur hover:-translate-y-1">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-48 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                            <Leaf className="w-16 h-16 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                          </div>
                        )}
                        {product.discount_price && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-red-500 text-white">
                              {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary">
                              ₹{product.discount_price || product.price}
                            </span>
                            {product.discount_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                          {product.rating > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-xs font-medium text-yellow-700">{product.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-primary text-primary text-xs">
                            {product.unit}
                          </Badge>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products available</h3>
              <p className="text-muted-foreground">
                This store hasn't added any products yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StoreDetail;