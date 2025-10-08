import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { testDatabaseConnection } from '@/utils/testDb';

interface SellerOrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  price: number;
  total: number;
  seller_status?: 'pending' | 'approved' | 'discarded' | 'received' | null;
  order: {
    order_number: string;
    created_at: string;
    user_id: string;
    status: string;
  };
  product: {
    name: string;
  };
  buyer?: {
    full_name: string | null;
    email: string | null;
  };
}

const SellerOrders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SellerOrderItemRow[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Test database connection first
      testDatabaseConnection().then(success => {
        if (success) {
          loadData();
        } else {
          toast({ title: 'Database Error', description: 'Please check if migrations are applied', variant: 'destructive' });
        }
      });
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', user!.id)
        .single();

      if (!store) {
        console.log('No store found for seller:', user!.id);
        setRows([]);
        setStoreId(null);
        return;
      }
      setStoreId(store.id);

      // Fetch order items for this store with nested order and product
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id, order_id, product_id, store_id, quantity, price, total, seller_status,
          order:orders(order_number, created_at, user_id, status),
          product:products(name)
        `)
        .eq('store_id', store.id)
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching seller orders:', error);
        if (error.message.includes('seller_status')) {
          toast({ 
            title: 'Migration Required', 
            description: 'The seller_status column does not exist. Please apply the database migration.', 
            variant: 'destructive' 
          });
        }
        throw error;
      }

      console.log('Seller orders query result:', { data, error, storeId: store.id });
      const items = (data as unknown as SellerOrderItemRow[]) || [];

      // Fetch buyer profiles (map unique user_ids)
      const uniqueBuyerIds = Array.from(new Set(items.map(r => r.order.user_id).filter(Boolean)));
      if (uniqueBuyerIds.length > 0) {
        const { data: buyers } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', uniqueBuyerIds);
        const map = new Map((buyers || []).map(b => [b.id, b] as const));
        items.forEach(r => {
          const b = map.get(r.order.user_id);
          if (b) {
            r.buyer = { full_name: b.full_name, email: b.email };
          }
        });
      }

      setRows(items);
    } catch (e: any) {
      console.error('Error loading seller orders:', e);
      toast({ title: 'Error', description: e.message || 'Failed to load orders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (orderItemId: string, next: SellerOrderItemRow['seller_status']) => {
    try {
      setUpdating(orderItemId);
      const { error } = await supabase
        .from('order_items')
        .update({ seller_status: next })
        .eq('id', orderItemId);
      if (error) throw error;
      await loadData();
      toast({ title: 'Updated', description: `Item marked as ${next}` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const totals = useMemo(() => {
    const totalOrders = new Set(rows.map(r => r.order_id)).size;
    const revenue = rows
      .filter(r => ['approved', 'received'].includes(r.seller_status || 'pending'))
      .reduce((s, r) => s + Number(r.total || 0), 0);
    return { totalOrders, revenue };
  }, [rows]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading orders...</p>
        </div>
      </Layout>
    );
  }

  if (!storeId) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>No store found. Please create a store first.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Orders</h1>
          <div className="text-sm text-muted-foreground">
            {totals.totalOrders} orders • ₹{totals.revenue.toFixed(2)} revenue
          </div>
        </div>

        {/* Debug info
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm">Debug Info:</p>
          <p className="text-sm">Store ID: {storeId}</p>
          <p className="text-sm">Total rows: {rows.length}</p>
          <p className="text-sm">User ID: {user?.id}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => testDatabaseConnection()}
            className="mt-2"
          >
            Test Database Connection
          </Button>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle>Customer Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.order.order_number}</TableCell>
                      <TableCell>{row.buyer?.full_name || '—'}</TableCell>
                      <TableCell>{row.buyer?.email || '—'}</TableCell>
                      <TableCell className="max-w-[260px] truncate">{row.product?.name}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>₹{Number(row.price).toFixed(2)}</TableCell>
                      <TableCell>₹{Number(row.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          row.seller_status === 'received' ? 'default' :
                          row.seller_status === 'approved' ? 'secondary' :
                          row.seller_status === 'discarded' ? 'destructive' : 'secondary'
                        }>
                          {row.seller_status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" disabled={updating === row.id || row.seller_status === 'approved' || row.seller_status === 'discarded' || row.seller_status === 'received'} onClick={() => setStatus(row.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-red-600" disabled={updating === row.id || row.seller_status === 'approved' || row.seller_status === 'discarded' || row.seller_status === 'received'} onClick={() => setStatus(row.id, 'discarded')}>Discard</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SellerOrders;


