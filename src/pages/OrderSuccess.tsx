import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation, Link } from 'react-router-dom';

const OrderSuccess = () => {
  const location = useLocation() as { state?: any };
  const order = location.state?.order;
  const items = location.state?.items || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Placed Successfully</CardTitle>
          </CardHeader>
          <CardContent>
            {order ? (
              <div className="space-y-4">
                <div>
                  <div className="text-muted-foreground">Order Number</div>
                  <div className="font-semibold">{order.order_number}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Amount</div>
                  <div className="font-semibold">₹{order.total_amount}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Items</div>
                  <ul className="list-disc pl-6">
                    {items.map((it: any, idx: number) => (
                      <li key={idx}>Product {it.product_id} x{it.quantity} — ₹{it.total}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>Your order has been placed.</div>
            )}
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link to="/user-dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OrderSuccess;

