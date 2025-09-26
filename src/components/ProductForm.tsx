import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadProductImage, deleteProductImage } from '@/lib/imageUpload';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  onSuccess: () => void;
  productId?: string;
}

const ProductForm = ({ onSuccess, productId }: ProductFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    quantity: '',
    unit: '',
    category_id: '',
    images: [] as string[],
  });
  const [imageInput, setImageInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
    loadUserStore();
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadUserStore = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', user.id)
        .single();
      
      if (data) {
        setStoreId(data.id);
      }
    } catch (error) {
      console.error('Error loading user store:', error);
    }
  };

  const loadProduct = async () => {
    if (!productId) return;
    
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          discount_price: data.discount_price?.toString() || '',
          quantity: data.quantity?.toString() || '',
          unit: data.unit || '',
          category_id: data.category_id || '',
          images: data.images || [],
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...formData.images, imageInput.trim()],
      });
      setImageInput('');
    }
  };

  const handleRemoveImage = async (index: number) => {
    const imageUrl = formData.images[index];
    
    // If it's a Supabase storage URL, delete it from storage
    if (imageUrl.includes('supabase.co')) {
      await deleteProductImage(imageUrl);
    }
    
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
    setUploadingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !user) return;

    const fileArray = Array.from(files);
    const newUploadingStates = new Array(fileArray.length).fill(true);
    
    setUploadingImages(prev => [...prev, ...newUploadingStates]);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        const result = await uploadProductImage(file, user.id, productId);
        
        if (result.success && result.url) {
          return result.url;
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
      
      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully!`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(prev => prev.slice(0, -fileArray.length));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !storeId) {
      toast({
        title: "Error",
        description: "You need to have a store to add products.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        category_id: formData.category_id || null,
        store_id: storeId,
        status: 'active' as const,
        images: formData.images,
      };

      let error;
      if (productId) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId));
      } else {
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: productId ? "Product updated successfully!" : "Product added successfully!",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product. Please try again.",
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
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Enter product name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select value={formData.category_id} onValueChange={(value) => handleSelectChange('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your product"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.price}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_price">Discount Price (₹)</Label>
          <Input
            id="discount_price"
            name="discount_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.discount_price}
            onChange={handleInputChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select value={formData.unit} onValueChange={(value) => handleSelectChange('unit', value)} required>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilogram (kg)</SelectItem>
              <SelectItem value="gram">Gram (g)</SelectItem>
              <SelectItem value="liter">Liter (L)</SelectItem>
              <SelectItem value="ml">Milliliter (ml)</SelectItem>
              <SelectItem value="piece">Piece</SelectItem>
              <SelectItem value="dozen">Dozen</SelectItem>
              <SelectItem value="bundle">Bundle</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Stock Quantity *</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min="0"
          placeholder="Enter available quantity"
          value={formData.quantity}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Product Images */}
      <div className="space-y-4">
        <Label>Product Images</Label>
        <div className="space-y-3">
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages.some(uploading => uploading)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImages.some(uploading => uploading) ? 'Uploading...' : 'Upload Images'}
                </Button>
                <span className="block mt-2">or drag and drop images here</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, GIF up to 5MB each
              </p>
            </div>
          </div>

          {/* URL Input Section */}
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="Or enter image URL"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
            />
            <Button type="button" onClick={handleAddImage} variant="outline">
              Add URL
            </Button>
          </div>
          
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  {uploadingImages[index] ? (
                    <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <img 
                      src={image} 
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4K';
                      }}
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                    disabled={uploadingImages[index]}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading ? "Saving..." : productId ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;