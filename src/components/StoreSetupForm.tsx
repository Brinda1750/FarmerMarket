import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StoreSetupFormProps {
  onSuccess: () => void;
}

const StoreSetupForm = ({ onSuccess }: StoreSetupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setIsLoading(true);

    try {
      // assign random images
      const randomSeed = Math.floor(Math.random() * 1000000);
      const logoUrl = `https://picsum.photos/seed/storelogo-${randomSeed}/200/200`;
      const bannerUrl = `https://picsum.photos/seed/storebanner-${randomSeed}/1200/300`;
      const { error } = await supabase
        .from('stores')
        .insert([
          {
            ...formData,
            seller_id: user.id,
            status: 'pending',
            logo_url: logoUrl,
            banner_url: bannerUrl
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Store Created Successfully",
        description: "Your store has been created and is pending approval. You can start adding products now.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create store. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Store Name *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your store name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Store Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Tell customers about your store and products"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Store Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter store email address"
          value={formData.email}
          onChange={handleInputChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          placeholder="Enter your store address"
          value={formData.address}
          onChange={handleInputChange}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            type="text"
            placeholder="Enter your city"
            value={formData.city}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            type="text"
            placeholder="Enter your state"
            value={formData.state}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pincode">Pin Code</Label>
          <Input
            id="pincode"
            name="pincode"
            type="text"
            placeholder="Enter pin code"
            value={formData.pincode}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? "Creating..." : "Create Store"}
        </Button>
      </div>
    </form>
  );
};

export default StoreSetupForm;