import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import StoreSetupForm from '@/components/StoreSetupForm';
import StoreEditModal from '@/components/StoreEditModal';
import ProductForm from '@/components/ProductForm';
import { 
  Store, 
  Package, 
  TrendingUp, 
  DollarSign,
  Users,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Store {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  status: string;
  logo_url?: string;
  banner_url?: string;
  products: { id: string }[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  quantity: number;
  unit: string;
  status: string;
  images: string[];
  created_at: string;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

const SellerDashboard = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0
  });
  const [showStoreSetup, setShowStoreSetup] = useState(false);
  const [showEditStore, setShowEditStore] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSellerData();
    }
  }, [user]);

  const loadSellerData = async () => {
    try {
      // Check if seller has a store
      const { data: storeData } = await supabase
        .from('stores')
        .select(`
          *,
          products(id)
        `)
        .eq('seller_id', user!.id)
        .single();

      if (storeData) {
        setStore({
          ...storeData,
          products: storeData.products
        });
        
        // Load products for the table
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        setProducts(productsData || []);
        
        // Load stats
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id);

        const { count: orderCount } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeData.id);

        setStats({
          totalProducts: productCount || 0,
          totalOrders: orderCount || 0,
          totalRevenue: 0, // Will be calculated from order_items
          totalCustomers: 0 // Will be calculated from unique customers
        });
      } else {
        setShowStoreSetup(true);
      }
    } catch (error) {
      console.error('Error loading seller data:', error);
      setShowStoreSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCreated = () => {
    setShowStoreSetup(false);
    loadSellerData();
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });

      loadSellerData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your seller dashboard...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Seller Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name}! Manage your store and products.
            </p>
          </div>
          {store && (
            <Button asChild>
              <Link to="/seller/add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            </Button>
          )}
        </div>

        {store ? (
          <>
            {/* Store Info */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {store.logo_url ? (
                      <img 
                        src={store.logo_url} 
                        alt={store.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold">{store.name}</h2>
                      <p className="text-muted-foreground">{store.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          store.status === 'active' ? 'bg-green-100 text-green-800' :
                          store.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {store.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link to={`/store/${store.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Store
                      </Link>
                    </Button>
                    <Button variant="outline" onClick={() => setShowEditStore(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Store
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    Products in your store
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Orders received
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    Unique customers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Button className="h-16" variant="outline" asChild>
                <Link to="/seller/add-product" className="flex flex-col items-center justify-center">
                  <Plus className="w-6 h-6 mb-1" />
                  <span>Add Product</span>
                </Link>
              </Button>

              <Button className="h-16" variant="outline" asChild>
                <Link to="/seller/products" className="flex flex-col items-center justify-center">
                  <Package className="w-6 h-6 mb-1" />
                  <span>My Products</span>
                </Link>
              </Button>

              <Button className="h-16" variant="outline" asChild>
                <Link to="/seller/orders" className="flex flex-col items-center justify-center">
                  <TrendingUp className="w-6 h-6 mb-1" />
                  <span>Orders</span>
                </Link>
              </Button>

              <Button className="h-16" variant="outline" asChild>
                <Link to="/seller/analytics" className="flex flex-col items-center justify-center">
                  <DollarSign className="w-6 h-6 mb-1" />
                  <span>Analytics</span>
                </Link>
              </Button>
            </div>

            {/* Products Management Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Product Management</CardTitle>
                  <Button asChild>
                    <Link to="/seller/add-product">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first product to your store
                    </p>
                    <Button asChild>
                      <Link to="/seller/add-product">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Product
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {product.images && product.images.length > 0 ? (
                                  <img 
                                    src={product.images[0]} 
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {product.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  ₹{product.discount_price || product.price}
                                </span>
                                {product.discount_price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    ₹{product.price}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {product.quantity > 0 ? `${product.quantity} ${product.unit}` : 'Out of stock'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                product.status === 'active' ? 'default' :
                                product.status === 'inactive' ? 'secondary' :
                                'destructive'
                              }>
                                {product.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(product.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingProduct(product.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeletingProduct(product.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
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
          </>
        ) : null}

        {/* Store Setup Dialog */}
        <Dialog open={showStoreSetup} onOpenChange={() => {}}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Setup Your Store</DialogTitle>
            </DialogHeader>
            <StoreSetupForm onSuccess={handleStoreCreated} />
          </DialogContent>
        </Dialog>

        {/* Store Edit Modal */}
        <StoreEditModal
          isOpen={showEditStore}
          onClose={() => setShowEditStore(false)}
          store={store}
          onSuccess={() => {
            setShowEditStore(false);
            loadSellerData();
          }}
        />

        {/* Edit Product Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            {editingProduct && (
              <ProductForm 
                productId={editingProduct}
                onSuccess={() => {
                  setEditingProduct(null);
                  loadSellerData();
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Product Confirmation Dialog */}
        <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                from your store.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deletingProduct && handleDeleteProduct(deletingProduct)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default SellerDashboard;