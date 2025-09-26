import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Star, ShoppingCart, Heart, Store, MapPin, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  images: string[];
  rating: number;
  total_reviews: number;
  unit: string;
  quantity: number;
  status: string;
  stores: {
    id: string;
    name: string;
    city: string;
    state: string;
    logo_url?: string;
  };
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cartQuantity, setCartQuantity] = useState(1);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          stores(id, name, city, state, logo_url)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      setProduct(data);
    } catch (error: any) {
      console.error('Error loading product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = cartQuantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 1)) {
      setCartQuantity(newQuantity);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }
    if (!product) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .upsert([
          { user_id: profile.id, product_id: product.id }
        ], { onConflict: 'user_id,product_id', ignoreDuplicates: true });

      if (error) throw error;

      toast({ title: 'Added to Wishlist', description: `${product.name} has been added to your wishlist.` });
    } catch (error: any) {
      console.error('Add to wishlist error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add to wishlist.', variant: 'destructive' });
    }
  };

  const handleAddToCart = async () => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }
    if (!product) return;

    try {
      const { data: existing } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', profile.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existing) {
        const newQty = (existing.quantity || 1) + cartQuantity;
        const { error } = await supabase
          .from('cart')
          .update({ quantity: newQty })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart')
          .insert([{ user_id: profile.id, product_id: product.id, quantity: cartQuantity }]);
        if (error) throw error;
      }

      toast({ title: 'Added to Cart', description: `${product.name} x${cartQuantity} added to your cart.` });
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to add to cart.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading product details...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Product not found</h1>
            <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentPrice = product.discount_price || product.price;
  const discountPercentage = product.discount_price 
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary">Products</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[selectedImageIndex]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                      <Leaf className="w-32 h-32 text-green-600" />
                    </div>
                  )}
                  {discountPercentage > 0 && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 text-white text-lg px-3 py-1">
                        {discountPercentage}% OFF
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-primary shadow-lg' 
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              
                            {/* Store Info */}
                            {product.stores ? (
                <Link to={`/store/${product.stores.id}`} className="inline-flex items-center gap-2 hover:text-primary transition-colors mb-4">
                  {product.stores.logo_url ? (
                    <img 
                      src={product.stores.logo_url} 
                      alt={product.stores.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6" />
                  )}
                  <span className="font-medium">{product.stores.name}</span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{product.stores.city}, {product.stores.state}</span>
                  </div>
                </Link>
              ) : (
                <div className="text-sm text-muted-foreground mb-4">Store information unavailable</div>
              )}

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-full">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-medium text-yellow-700">{product.rating}</span>
                    <span className="text-yellow-600">
                      ({product.total_reviews} reviews)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold text-primary">₹{currentPrice}</span>
                {product.discount_price && (
                  <span className="text-xl text-muted-foreground line-through">₹{product.price}</span>
                )}
                <Badge variant="outline" className="border-primary text-primary">
                  per {product.unit}
                </Badge>
              </div>
              {discountPercentage > 0 && (
                <p className="text-green-600 font-medium">
                  You save ₹{product.price - product.discount_price!} ({discountPercentage}% off)
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'Fresh, high-quality produce from local farms.'}
              </p>
            </div>

            {/* Stock Status */}
            <div>
              <p className="text-sm text-muted-foreground">
                Stock: <span className={`font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.quantity > 0 ? `${product.quantity} ${product.unit} available` : 'Out of stock'}
                </span>
              </p>
            </div>

            {/* Quantity Selector */}
            {product.quantity > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuantityChange(-1)}
                      disabled={cartQuantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium w-12 text-center">{cartQuantity}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleQuantityChange(1)}
                      disabled={cartQuantity >= product.quantity}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-2">
                      {product.unit}
                    </span>
                  </div>
                </div>

                {/* Total Price */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Price:</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{(currentPrice * cartQuantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleAddToWishlist}>
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}

            {product.quantity === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">This product is currently out of stock</p>
                <Button variant="outline" onClick={handleAddToWishlist}>
                  <Heart className="w-4 h-4 mr-2" />
                  Add to Wishlist
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;