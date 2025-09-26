import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import { Leaf, Star, Heart, ShoppingCart, Users, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { 
  dummyCategories, 
  dummyProducts, 
  dummyStores, 
  getFeaturedProducts, 
  getActiveStores 
} from '@/data/dummyData';
import heroImage from "@/assets/hero-farming.jpg";
import vegetablesIcon from "@/assets/vegetables-icon.jpg";
import fruitsIcon from "@/assets/fruits-icon.jpg";
import dairyIcon from "@/assets/dairy-icon.jpg";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  images: string[];
  rating: number;
  total_reviews: number;
  unit: string;
  store: {
    name: string;
    id: string;
  };
  category: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

interface Store {
  id: string;
  name: string;
  description: string;
  city: string;
  rating: number;
  total_reviews: number;
  status: string;
}

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularStores, setPopularStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Using dummy data for now - will be replaced with real data later
      setCategories(dummyCategories);
      setFeaturedProducts(getFeaturedProducts());
      setPopularStores(getActiveStores());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
          <div className="container mx-auto px-4 py-20 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full">
                  <Leaf className="w-5 h-5 text-primary mr-2" />
                  <span className="text-primary font-medium">100% Organic & Fresh</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Fresh from <span className="text-primary">Farm</span> to Your Table
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Connect directly with local farmers and get the freshest organic produce delivered to your doorstep. Support local agriculture while enjoying premium quality food.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg" asChild>
                    <Link to={user ? "#products" : "/auth"}>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Shop Now
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
                    <Link to="/auth">
                      <Users className="w-5 h-5 mr-2" />
                      Become a Seller
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center gap-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">500+</div>
                    <div className="text-sm text-muted-foreground">Local Farmers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">10k+</div>
                    <div className="text-sm text-muted-foreground">Happy Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">Fresh</div>
                    <div className="text-sm text-muted-foreground">Daily Delivery</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl transform rotate-3" />
                <img 
                  src={heroImage} 
                  alt="Fresh organic produce from local farms" 
                  className="relative rounded-3xl shadow-2xl w-full h-[600px] object-cover hover-scale transition-transform duration-500"
                />
                <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-2xl shadow-lg border">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Truck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Free Delivery</div>
                      <div className="text-sm text-muted-foreground">Same day delivery available</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 px-4 bg-muted/30" id="categories">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Shop by Category
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover fresh, organic produce from local farmers in your area
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories.map((category, index) => {
                const images = [vegetablesIcon, fruitsIcon, dairyIcon, vegetablesIcon];
                return (
                  <Card key={category.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-0 bg-card/80 backdrop-blur hover:-translate-y-2">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img 
                          src={images[index]} 
                          alt={category.name}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-20 px-4" id="products">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Hand-picked premium products from our trusted local farmers
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <Link key={product.id} to={`/product/${product.id}`}>
                  <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-0 bg-card/80 backdrop-blur hover:-translate-y-1">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                          <Leaf className="w-20 h-20 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="absolute top-4 right-4">
                          <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white p-2 rounded-full shadow-md">
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>
                        {product.discount_price && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-red-500 text-white">
                              {Math.round(((product.price - product.discount_price) / product.price) * 100)}% OFF
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
                          {product.name}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-primary">
                              ₹{product.discount_price || product.price}
                            </span>
                            {product.discount_price && (
                              <span className="text-lg text-muted-foreground line-through">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-yellow-700">{product.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-primary text-primary">
                            {product.unit}
                          </Badge>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Stores */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Popular Stores
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover top-rated stores from verified local farmers
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {popularStores.map((store) => (
                <Link key={store.id} to={`/store/${store.id}`}>
                  <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group border-0 bg-card/80 backdrop-blur hover:-translate-y-1">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Leaf className="w-10 h-10 text-primary" />
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white">
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {store.name}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">📍 {store.city}</p>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                          {store.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium text-yellow-700">{store.rating}</span>
                            <span className="text-xs text-yellow-600">
                              ({store.total_reviews})
                            </span>
                          </div>
                          <Badge variant="outline" className={`
                            ${store.status === 'active' ? 'border-green-500 text-green-700 bg-green-50' : ''}
                            ${store.status === 'pending' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : ''}
                          `}>
                            {store.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 px-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied customers who choose fresh, local produce and support sustainable farming
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" variant="secondary" className="px-8 py-6 text-lg font-semibold" asChild>
                <Link to={user ? "#products" : "/auth"}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Browse Products
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-6 text-lg font-semibold"
                asChild
              >
                <Link to="/auth">
                  <Users className="w-5 h-5 mr-2" />
                  Start Selling
                </Link>
              </Button>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Shopping</h3>
                <p className="opacity-90">Browse and buy from local farmers with just a few clicks</p>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="opacity-90">Get fresh produce delivered to your doorstep same day</p>
              </div>
              <div className="text-center">
                <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">100% Organic</h3>
                <p className="opacity-90">All products are certified organic and pesticide-free</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;