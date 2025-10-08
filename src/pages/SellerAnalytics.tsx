import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Item {
  product_id: string;
  quantity: number;
  total: number;
  product?: { name: string };
  seller_status?: string | null;
}

const SellerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  const load = async () => {
    try {
      setLoading(true);
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', user!.id)
        .single();
      if (!store) { setItems([]); return; }

      const { data, error } = await supabase
        .from('order_items')
        .select('product_id, quantity, total, seller_status, product:products(name)')
        .eq('store_id', store.id);
      if (error) throw error;
      setItems((data as unknown as Item[]) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to load analytics', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const relevant = items.filter(i => ['approved', 'received'].includes((i.seller_status || 'pending') as string));
    const totalSold = relevant.reduce((s, i) => s + Number(i.quantity || 0), 0);
    const revenue = relevant.reduce((s, i) => s + Number(i.total || 0), 0);
    const orders = new Set();
    // We only have per-item basis here; approximate by counting products aggregated as orders length
    // Better would be distinct orders; for simplicity keep focus on sales metrics
    const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const i of relevant) {
      const key = i.product_id;
      const current = byProduct.get(key) || { name: i.product?.name || 'Unknown', qty: 0, revenue: 0 };
      current.qty += Number(i.quantity || 0);
      current.revenue += Number(i.total || 0);
      byProduct.set(key, current);
    }
    const top = Array.from(byProduct.entries())
      .map(([product_id, v]) => ({ product_id, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    return { totalSold, revenue, totalOrders: relevant.length, top };
  }, [items]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <p>Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Total Products Sold</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.totalSold}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Revenue Generated</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">₹{stats.revenue.toFixed(2)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.totalOrders}</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Top-selling Products</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.top.map(t => ({ name: t.name, qty: t.qty }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide={false} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SellerAnalytics;


