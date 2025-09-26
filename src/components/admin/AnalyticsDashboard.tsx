import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { TrendingUp, Users, Store, Package, ShoppingCart } from 'lucide-react';

interface AnalyticsData {
  usersOverTime: Array<{
    date: string;
    users: number;
    cumulative: number;
  }>;
  storesByStatus: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  productsByCategory: Array<{
    category: string;
    count: number;
  }>;
  ordersOverTime: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  topStores: Array<{
    name: string;
    products: number;
    orders: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData>({
    usersOverTime: [],
    storesByStatus: [],
    productsByCategory: [],
    ordersOverTime: [],
    topStores: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      // Load users over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: userData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Process users over time
      const usersByDate: { [key: string]: number } = {};
      let cumulative = 0;
      
      userData?.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        usersByDate[date] = (usersByDate[date] || 0) + 1;
      });

      const usersOverTime = Object.entries(usersByDate).map(([date, count]) => {
        cumulative += count;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: count,
          cumulative
        };
      });

      // Load stores by status
      const { data: storeData } = await supabase
        .from('stores')
        .select('status');

      const storesByStatus = [
        { name: 'Active', value: storeData?.filter(s => s.status === 'active').length || 0, color: '#00C49F' },
        { name: 'Pending', value: storeData?.filter(s => s.status === 'pending').length || 0, color: '#FFBB28' },
        { name: 'Inactive', value: storeData?.filter(s => s.status === 'inactive').length || 0, color: '#FF8042' }
      ];

      // Load products by category
      const { data: productData } = await supabase
        .from('products')
        .select(`
          category_id,
          categories!inner(name)
        `);

      const categoryCounts: { [key: string]: number } = {};
      productData?.forEach(product => {
        const categoryName = product.categories?.name || 'Uncategorized';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });

      const productsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
      }));

      // Load orders over time
      const { data: orderData } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const ordersByDate: { [key: string]: { orders: number; revenue: number } } = {};
      
      orderData?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!ordersByDate[date]) {
          ordersByDate[date] = { orders: 0, revenue: 0 };
        }
        ordersByDate[date].orders += 1;
        ordersByDate[date].revenue += order.total_amount;
      });

      const ordersOverTime = Object.entries(ordersByDate).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: data.orders,
        revenue: data.revenue
      }));

      // Load top stores
      const { data: topStoresData } = await supabase
        .from('stores')
        .select(`
          name,
          products(id),
          order_items!inner(id)
        `)
        .limit(5);

      const topStores = topStoresData?.map(store => ({
        name: store.name,
        products: store.products?.length || 0,
        orders: store.order_items?.length || 0
      })) || [];

      setData({
        usersOverTime,
        storesByStatus,
        productsByCategory,
        ordersOverTime,
        topStores
      });
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-8">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.usersOverTime[data.usersOverTime.length - 1]?.cumulative || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data.usersOverTime.length} new users this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.storesByStatus.find(s => s.name === 'Active')?.value || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data.storesByStatus.find(s => s.name === 'Pending')?.value || 0} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.productsByCategory.reduce((sum, cat) => sum + cat.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data.productsByCategory.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{data.ordersOverTime.reduce((sum, order) => sum + order.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {data.ordersOverTime.reduce((sum, order) => sum + order.orders, 0)} orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.usersOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cumulative" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stores by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Stores by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.storesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.storesByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Products by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.productsByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders and Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Orders & Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.ordersOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="orders" fill="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Stores Table */}
      {data.topStores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topStores.map((store, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{store.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {store.products} products • {store.orders} orders
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{store.products} products</Badge>
                    <Badge variant="secondary">{store.orders} orders</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
