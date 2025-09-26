import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  Users, 
  Award, 
  Truck, 
  Shield, 
  Heart,
  Star,
  CheckCircle
} from 'lucide-react';

const About = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
              <Leaf className="w-5 h-5 text-primary mr-2" />
              <span className="text-primary font-medium">About FarmerMarket</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Connecting Farmers <span className="text-primary">Directly</span> to You
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We believe in supporting local agriculture while providing consumers with the freshest, 
              highest quality produce. Our platform bridges the gap between farmers and consumers, 
              creating a sustainable ecosystem for everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/">
                  <Leaf className="w-5 h-5 mr-2" />
                  Explore Products
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">
                  <Users className="w-5 h-5 mr-2" />
                  Join as Seller
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                To create a sustainable future for agriculture by connecting farmers directly with consumers
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center border-0 bg-card/80 backdrop-blur">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>Support Local Farmers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We empower local farmers by providing them with a direct platform to sell their produce, 
                    ensuring fair prices and sustainable farming practices.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 bg-card/80 backdrop-blur">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>Fresh & Organic</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All our products are sourced directly from farms, ensuring maximum freshness and quality. 
                    We prioritize organic and sustainable farming methods.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 bg-card/80 backdrop-blur">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle>Community First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We build strong relationships between farmers and consumers, creating a community 
                    that values quality, sustainability, and local produce.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Why Choose FarmerMarket?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We offer the best experience for both farmers and consumers
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Quality Guaranteed</h3>
                <p className="text-muted-foreground text-sm">
                  Every product is verified for quality and freshness
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Same-day delivery available in most areas
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Best Prices</h3>
                <p className="text-muted-foreground text-sm">
                  Direct from farm pricing without middlemen
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Trusted Reviews</h3>
                <p className="text-muted-foreground text-sm">
                  Real reviews from verified customers
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Our Impact</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Together, we're making a difference in agriculture and communities
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Local Farmers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-muted-foreground">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
                <div className="text-muted-foreground">Orders Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">25+</div>
                <div className="text-muted-foreground">Cities Served</div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary mt-1" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Sustainability</h3>
                  <p className="text-muted-foreground">
                    We promote sustainable farming practices that protect our environment 
                    and ensure long-term agricultural viability.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary mt-1" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Transparency</h3>
                  <p className="text-muted-foreground">
                    Complete transparency in our sourcing, pricing, and delivery processes. 
                    You know exactly where your food comes from.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary mt-1" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Quality</h3>
                  <p className="text-muted-foreground">
                    We never compromise on quality. Every product meets our strict 
                    standards for freshness and nutritional value.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-primary mt-1" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Community</h3>
                  <p className="text-muted-foreground">
                    Building strong, supportive communities by connecting local farmers 
                    with conscious consumers who care about their food.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6">
              Ready to Join Our Community?
            </h2>
            <p className="text-2xl mb-12 opacity-90 max-w-3xl mx-auto">
              Whether you're a farmer looking to sell your produce or a consumer seeking fresh, 
              local food, we welcome you to our growing community.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/">
                  <Leaf className="w-5 h-5 mr-2" />
                  Start Shopping
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link to="/auth">
                  <Users className="w-5 h-5 mr-2" />
                  Become a Seller
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default About;