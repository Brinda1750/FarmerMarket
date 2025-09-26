import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Package, ShoppingCart } from 'lucide-react';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    discount_price?: number;
    images: string[];
    unit: string;
  }
}

const Cart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      loadCart();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const loadCart = async () => {
    try {
      const { data } = await supabase
        .from('cart')
        .select(`*, product:products(*)`)
        .eq('user_id', profile!.id)
        .order('updated_at', { ascending: false });
      setItems((data as unknown as CartItem[]) || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({ title: 'Error', description: 'Failed to load cart', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (cartId: string, newQty: number) => {
    if (newQty <= 0) {
      await supabase.from('cart').delete().eq('id', cartId);
    } else {
      await supabase.from('cart').update({ quantity: newQty }).eq('id', cartId);
    }
    await loadCart();
  };

  const total = items.reduce((sum, item) => sum + (Number(item.product.discount_price ?? item.product.price) * item.quantity), 0);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading cart...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Cart</h1>
          {items.length > 0 && (
            <Button onClick={() => navigate('/checkout')}>Proceed to Checkout</Button>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <Button asChild>
                  <Link to="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.product.images && item.product.images.length > 0 ? (
                                <img src={item.product.images[0]} alt={item.product.name} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                  <Package className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{item.product.name}</div>
                                <div className="text-sm text-muted-foreground">{item.product.unit}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>₹{item.product.discount_price || item.product.price}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => updateQty(item.id, item.quantity - 1)}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button variant="outline" size="sm" onClick={() => updateQty(item.id, item.quantity + 1)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>₹{(Number(item.product.discount_price ?? item.product.price) * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-6">
                  <div className="text-right">
                    <div className="text-muted-foreground">Subtotal</div>
                    <div className="text-2xl font-bold">₹{total.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={() => navigate('/checkout')}>Proceed to Checkout</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Cart;

