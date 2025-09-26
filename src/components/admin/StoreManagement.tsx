import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Store, Search, MoreHorizontal, CheckCircle, XCircle, Eye, MapPin } from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  status: string;
  seller_id: string;
  created_at: string;
  seller: {
    full_name: string;
    email: string;
  };
  products: { id: string }[];
}

interface StoreManagementProps {
  onStoreUpdated: () => void;
}

const StoreManagement = ({ onStoreUpdated }: StoreManagementProps) => {
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
        store.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.seller.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.seller.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          seller:profiles!stores_seller_id_fkey(full_name, email),
          products(id)
        `)
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

  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Store ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`,
      });

      onStoreUpdated();
      loadStores();
    } catch (error: any) {
      console.error('Error updating store status:', error);
      toast({
        title: "Error",
        description: "Failed to update store status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status: 'active' })
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Store approved successfully!",
      });

      onStoreUpdated();
      loadStores();
    } catch (error: any) {
      console.error('Error approving store:', error);
      toast({
        title: "Error",
        description: "Failed to approve store. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            <CardTitle>Store Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredStores.length === 0 ? (
          <div className="text-center py-8">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stores found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search terms' : 'No stores are registered yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Store className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {store.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{store.seller.full_name}</div>
                        <div className="text-sm text-muted-foreground">{store.seller.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">
                          {store.city}{store.state ? `, ${store.state}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {store.products?.length || 0} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        store.status === 'active' ? 'default' :
                        store.status === 'pending' ? 'secondary' :
                        'destructive'
                      }>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(store.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/store/${store.id}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-2" />
                              View Store
                            </a>
                          </DropdownMenuItem>
                          {store.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleApproveStore(store.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Store
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleToggleStoreStatus(store.id, store.status)}
                          >
                            {store.status === 'active' ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoreManagement;
