import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
    store_id: string;
  }
}

const Checkout = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
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

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.product.discount_price ?? item.product.price) * item.quantity), 0), [items]);

  const placeOrder = async () => {
    if (!profile || items.length === 0) return;
    setPlacing(true);
    try {
      const orderNumber = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: profile.id,
            order_number: orderNumber,
            total_amount: subtotal,
            status: 'pending',
            shipping_address: address,
            shipping_city: city,
            shipping_state: state,
            shipping_pincode: pincode,
            shipping_phone: phone,
            payment_method: 'cod',
            payment_status: 'pending'
          }
        ])
        .select('*')
        .single();

      if (orderError) throw orderError;

      const orderItemsPayload = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        store_id: item.product.store_id,
        quantity: item.quantity,
        price: Number(item.product.discount_price ?? item.product.price),
        total: Number(item.product.discount_price ?? item.product.price) * item.quantity,
      }));

      const { error: oiError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (oiError) throw oiError;

      console.log('Order created successfully:', { order, orderItemsPayload });

      await supabase.from('cart').delete().eq('user_id', profile.id);

      navigate('/order-success', { state: { order, items: orderItemsPayload } });
    } catch (error: any) {
      console.error('Place order error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to place order', variant: 'destructive' });
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading checkout...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Address</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Street" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="123456" />
                </div>
                <div className="md:col-span-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999999999" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{(Number(item.product.discount_price ?? item.product.price) * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <Button className="w-full mt-4" disabled={placing || items.length === 0} onClick={placeOrder}>
                {placing ? 'Placing Order...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;

