import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Leaf, Star, Store, Search, Filter, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StoreData {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  rating: number;
  total_reviews: number;
  status: string;
  logo_url?: string;
  banner_url?: string;
  products: { id: string }[];
}

const Stores = () => {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStores, setFilteredStores] = useState<StoreData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = stores.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.state.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores(stores);
    }
  }, [searchQuery, stores]);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          products(id)
        `)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStores(data || []);
      setFilteredStores(data || []);
    } catch (error: any) {
      console.error('Error loading stores:', error);
      toast({
        title: "Error",
        description: "Failed to load stores. Please try again.",
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
              <p>Loading stores...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            All Stores
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover stores from verified local farmers and sellers
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search stores, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" className="md:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No stores found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'No stores are available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <Link key={store.id} to={`/store/${store.id}`}>
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-card/80 backdrop-blur hover:-translate-y-1">
                  <CardContent className="p-0">
                    {/* Store Banner */}
                    <div className="relative overflow-hidden rounded-t-lg h-32 bg-gradient-to-br from-primary/10 to-secondary/10">
                      {store.banner_url ? (
                        <img 
                          src={store.banner_url} 
                          alt={`${store.name} banner`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-12 h-12 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-green-500 text-white">
                          Verified
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Store Logo and Name */}
                      <div className="flex items-center gap-3 mb-3">
                        {store.logo_url ? (
                          <img 
                            src={store.logo_url} 
                            alt={store.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Store className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {store.name}
                          </h3>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-1 mb-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {store.city}{store.state ? `, ${store.state}` : ''}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                        {store.description || 'Fresh organic produce from local farms'}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{store.products?.length || 0}</span> products
                        </div>
                        {store.rating > 0 && (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs font-medium text-yellow-700">{store.rating}</span>
                            <span className="text-xs text-yellow-600">
                              ({store.total_reviews})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={`
                          ${store.status === 'active' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                          ${store.status === 'pending' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                        `}>
                          {store.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Visit Store
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Showing {filteredStores.length} of {stores.length} stores
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Stores;