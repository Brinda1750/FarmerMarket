import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  ShoppingCart, 
  Package,
  Trash2,
  Eye,
  Plus,
  Minus
} from 'lucide-react';
import jsPDF from 'jspdf';

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    images: string[];
    unit: string;
  };
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    images: string[];
    unit: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    seller_status?: 'pending' | 'approved' | 'discarded' | 'received';
    product: {
      name: string;
      images: string[];
    };
  }[];
}

const UserDashboard = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile) {
      loadDashboardData();
    }
  }, [user, profile]);

  const loadDashboardData = async () => {
    try {
      // Load wishlist items
      const { data: wishlistData } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });

      // Load cart items
      const { data: cartData } = await supabase
        .from('cart')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', profile!.id)
        .order('updated_at', { ascending: false });

      // Load orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(name, images)
          )
        `)
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });

      setWishlistItems(wishlistData || []);
      setCartItems(cartData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item removed from wishlist!",
      });

      loadDashboardData();
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist.",
        variant: "destructive",
      });
    } finally {
      setRemovingItem(null);
    }
  };

  const handleRemoveFromCart = async (cartId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item removed from cart!",
      });

      loadDashboardData();
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    } finally {
      setRemovingItem(null);
    }
  };

  const handleUpdateCartQuantity = async (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(cartId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', cartId);

      if (error) throw error;

      loadDashboardData();
    } catch (error: any) {
      console.error('Error updating cart quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update cart quantity.",
        variant: "destructive",
      });
    }
  };

  const generateReceipt = (order: Order) => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(16);
    doc.text('Order Receipt', 14, y); y += 8;
    doc.setFontSize(11);
    doc.text(`Order #: ${order.order_number}`, 14, y); y += 6;
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`, 14, y); y += 10;

    doc.setFontSize(12);
    doc.text('Items:', 14, y); y += 6;
    doc.setFontSize(11);
    order.order_items.forEach((it) => {
      const line = `${it.product.name}  x${it.quantity}  ₹${(it.price * it.quantity).toFixed(2)}`;
      doc.text(line, 16, y);
      y += 6;
      if (y > 280) { doc.addPage(); y = 15; }
    });
    y += 4;
    doc.setFontSize(12);
    doc.text(`Total: ₹${order.total_amount}`, 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text('Thank you for your purchase!', 14, y);
    doc.save(`receipt_${order.order_number}.pdf`);
  };

  const confirmReceived = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ seller_status: 'received', received_confirmed: true, received_at: new Date().toISOString() })
        .eq('order_id', orderId)
        .eq('seller_status', 'approved');
      if (error) throw error;
      toast({ title: 'Thank you!', description: 'Delivery confirmed.' });
      loadDashboardData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to confirm receipt', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your dashboard...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {profile?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Manage your wishlist, cart, and orders from your dashboard.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wishlistItems.length}</div>
              <p className="text-xs text-muted-foreground">Items saved for later</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Items</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cartItems.length}</div>
              <p className="text-xs text-muted-foreground">Ready to checkout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">Orders placed</p>
            </CardContent>
          </Card>
        </div>

        {/* Listed Items (Wishlist) */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <CardTitle>Listed Items (Wishlist)</CardTitle>
              </div>
              <Button variant="outline" asChild>
                <Link to="/products">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Products
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {wishlistItems.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items in wishlist</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding products to your wishlist
                </p>
                <Button asChild>
                  <Link to="/products">
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Products
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
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wishlistItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.product.unit}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              ₹{item.product.discount_price || item.product.price}
                            </span>
                            {item.product.discount_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{item.product.price}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/product/${item.product.id}`}>
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Link>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setRemovingItem(item.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Cart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <CardTitle>My Cart</CardTitle>
              </div>
              {cartItems.length > 0 && (
                <Button asChild>
                  <Link to="/checkout">
                    Proceed to Checkout
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding products to your cart
                </p>
                <Button asChild>
                  <Link to="/products">
                    <Plus className="w-4 h-4 mr-2" />
                    Browse Products
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
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.product.images && item.product.images.length > 0 ? (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.product.unit}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              ₹{item.product.discount_price || item.product.price}
                            </span>
                            {item.product.discount_price && (
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{item.product.price}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            ₹{((item.product.discount_price || item.product.price) * item.quantity).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setRemovingItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <CardTitle>My Orders</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your order history will appear here
                </p>
                <Button asChild>
                  <Link to="/products">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Shopping
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">{order.order_number}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.order_items.slice(0, 2).map(item => item.product.name).join(', ')}
                            {order.order_items.length > 2 && ` +${order.order_items.length - 2} more`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">₹{order.total_amount}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.order_items.some(it => it.seller_status === 'received') ? 'default' :
                            order.order_items.some(it => it.seller_status === 'approved') ? 'secondary' :
                            order.order_items.some(it => it.seller_status === 'discarded') ? 'destructive' :
                            'outline'
                          }>
                            {order.order_items.some(it => it.seller_status === 'received') ? 'Received' :
                             order.order_items.some(it => it.seller_status === 'approved') ? 'Approved' :
                             order.order_items.some(it => it.seller_status === 'discarded') ? 'Discarded' :
                             'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => setViewingOrder(order)}>
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                          {order.order_items.some(it => it.seller_status === 'approved') && !order.order_items.some(it => it.seller_status === 'received') && (
                            <Button className="ml-2" size="sm" onClick={() => confirmReceived(order.id)}>
                              Received
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!removingItem} onOpenChange={() => setRemovingItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The item will be removed from your list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (removingItem) {
                    const isWishlistItem = wishlistItems.find(item => item.id === removingItem);
                    if (isWishlistItem) {
                      handleRemoveFromWishlist(removingItem);
                    } else {
                      handleRemoveFromCart(removingItem);
                    }
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Order Details Modal */}
        <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-muted-foreground">Order #</div>
                    <div className="font-medium">{viewingOrder.order_number}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Placed On</div>
                    <div className="font-medium">{new Date(viewingOrder.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <div className="font-medium">{viewingOrder.status}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">₹{viewingOrder.total_amount}</div>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-2">Items</div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingOrder.order_items.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell className="max-w-[280px] truncate">{it.product.name}</TableCell>
                            <TableCell>{it.quantity}</TableCell>
                            <TableCell>₹{it.price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewingOrder(null)}>Close</Button>
                  <Button onClick={() => generateReceipt(viewingOrder)}>Download Order Receipt</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default UserDashboard;