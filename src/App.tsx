import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/layout/Header";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSetup from "./pages/AdminSetup";
import ProductDetail from "./pages/ProductDetail";
import StoreDetail from "./pages/StoreDetail";
import Products from "./pages/Products";
import Stores from "./pages/Stores";
import AddProduct from "./pages/AddProduct";
import SellerProducts from "./pages/SellerProducts";
import SellerOrders from "./pages/SellerOrders";
import SellerAnalytics from "./pages/SellerAnalytics";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/seller-dashboard" element={<SellerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/seller/add-product" element={<AddProduct />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/analytics" element={<SellerAnalytics />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/about" element={<About />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/store/:id" element={<StoreDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
