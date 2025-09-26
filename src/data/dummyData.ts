// Dummy data for stores and products
export const dummyCategories = [
  {
    id: '1',
    name: 'Fresh Vegetables',
    description: 'Organic vegetables directly from local farms',
    image_url: 'vegetables-icon.jpg',
    is_active: true
  },
  {
    id: '2', 
    name: 'Fresh Fruits',
    description: 'Seasonal fruits picked at perfect ripeness',
    image_url: 'fruits-icon.jpg',
    is_active: true
  },
  {
    id: '3',
    name: 'Dairy Products',
    description: 'Fresh milk, cheese, and dairy from local farms',
    image_url: 'dairy-icon.jpg',
    is_active: true
  },
  {
    id: '4',
    name: 'Grains & Cereals',
    description: 'Wholesome grains and cereals',
    image_url: 'vegetables-icon.jpg',
    is_active: true
  }
];

export const dummyStores = [
  {
    id: '1',
    name: 'Green Valley Farm',
    description: 'Family-owned farm specializing in organic vegetables and herbs',
    logo_url: null,
    banner_url: null,
    address: '123 Farm Road',
    city: 'Fresno',
    state: 'California',
    pincode: '93701',
    phone: '+1-555-0123',
    email: 'contact@greenvalley.com',
    rating: 4.8,
    total_reviews: 245,
    status: 'active'
  },
  {
    id: '2',
    name: 'Sunshine Orchard',
    description: 'Premium fruit orchard with over 50 years of experience',
    logo_url: null,
    banner_url: null,
    address: '456 Orchard Lane',
    city: 'Modesto',
    state: 'California', 
    pincode: '95350',
    phone: '+1-555-0456',
    email: 'info@sunshineorchard.com',
    rating: 4.9,
    total_reviews: 189,
    status: 'active'
  },
  {
    id: '3',
    name: 'Mountain View Dairy',
    description: 'Fresh dairy products from grass-fed cows in mountain pastures',
    logo_url: null,
    banner_url: null,
    address: '789 Mountain Road',
    city: 'Bakersfield',
    state: 'California',
    pincode: '93301',
    phone: '+1-555-0789',
    email: 'orders@mountainviewdairy.com',
    rating: 4.7,
    total_reviews: 156,
    status: 'active'
  }
];

export const dummyProducts = [
  {
    id: '1',
    name: 'Organic Tomatoes',
    description: 'Fresh, juicy organic tomatoes perfect for salads and cooking',
    price: 120,
    discount_price: 99,
    images: ['/placeholder.svg'],
    rating: 4.5,
    total_reviews: 23,
    unit: 'kg',
    quantity: 50,
    is_featured: true,
    status: 'active',
    store_id: '1',
    category_id: '1',
    store: {
      id: '1',
      name: 'Green Valley Farm',
      city: 'Fresno',
      state: 'California',
      logo_url: null
    },
    category: {
      name: 'Fresh Vegetables'
    }
  },
  {
    id: '2',
    name: 'Fresh Spinach',
    description: 'Nutrient-rich spinach leaves, perfect for healthy meals',
    price: 80,
    discount_price: null,
    images: ['/placeholder.svg'],
    rating: 4.3,
    total_reviews: 18,
    unit: 'bunch',
    quantity: 30,
    is_featured: true,
    status: 'active',
    store_id: '1',
    category_id: '1',
    store: {
      id: '1',
      name: 'Green Valley Farm',
      city: 'Fresno',
      state: 'California',
      logo_url: null
    },
    category: {
      name: 'Fresh Vegetables'
    }
  },
  {
    id: '3',
    name: 'Sweet Oranges',
    description: 'Juicy and sweet oranges packed with Vitamin C',
    price: 150,
    discount_price: 135,
    images: ['/placeholder.svg'],
    rating: 4.7,
    total_reviews: 41,
    unit: 'kg',
    quantity: 75,
    is_featured: true,
    status: 'active',
    store_id: '2',
    category_id: '2',
    store: {
      id: '2',
      name: 'Sunshine Orchard',
      city: 'Modesto',
      state: 'California',
      logo_url: null
    },
    category: {
      name: 'Fresh Fruits'
    }
  },
  {
    id: '4',
    name: 'Farm Fresh Apples',
    description: 'Crisp and delicious apples from our organic orchard',
    price: 200,
    discount_price: null,
    images: ['/placeholder.svg'],
    rating: 4.6,
    total_reviews: 33,
    unit: 'kg',
    quantity: 60,
    is_featured: true,
    status: 'active',
    store_id: '2',
    category_id: '2',
    store: {
      id: '2',
      name: 'Sunshine Orchard',
      city: 'Modesto',
      state: 'California',
      logo_url: null
    },
    category: {
      name: 'Fresh Fruits'
    }
  },
  {
    id: '5',
    name: 'Whole Milk',
    description: 'Fresh whole milk from grass-fed cows, rich in nutrients',
    price: 65,
    discount_price: null,
    images: ['/placeholder.svg'],
    rating: 4.8,
    total_reviews: 52,
    unit: 'liter',
    quantity: 25,
    is_featured: true,
    status: 'active',
    store_id: '3',
    category_id: '3',
    store: {
      id: '3',
      name: 'Mountain View Dairy',
      city: 'Bakersfield',
      state: 'California',
      logo_url: null
    },
    category: {
      name: 'Dairy Products'
    }
  },
  {
    id: '6',
    name: 'Fresh Cheese',
    description: 'Artisanal cheese made from premium farm milk',
    price: 350,
    discount_price: 299,
    images: ['/placeholder.svg'],
    rating: 4.9,
    total_reviews: 28,
    unit: 'pack',
    quantity: 15,
    is_featured: true,
    status: 'active',
    store_id: '3',
    category_id: '3',
    store: {
      id: '3',
      name: 'Mountain View Dairy',
      city: 'Bakersfield',
      state: 'California',
      logo_url: null
    },
    category: {
      name: 'Dairy Products'
    }
  }
];

export const dummyReviews = [
  {
    id: '1',
    product_id: '1',
    rating: 5,
    review_text: 'Amazing tomatoes! Very fresh and flavorful.',
    created_at: '2024-01-15T10:30:00Z',
    profiles: {
      full_name: 'John Smith',
      avatar_url: null
    }
  },
  {
    id: '2',
    product_id: '1',
    rating: 4,
    review_text: 'Good quality, will order again.',
    created_at: '2024-01-10T14:20:00Z',
    profiles: {
      full_name: 'Sarah Johnson',
      avatar_url: null
    }
  },
  {
    id: '3',
    product_id: '3',
    rating: 5,
    review_text: 'Best oranges I have ever tasted!',
    created_at: '2024-01-12T09:15:00Z',
    profiles: {
      full_name: 'Mike Wilson',
      avatar_url: null
    }
  }
];

// Helper functions to get dummy data
export const getDummyStoreById = (storeId: string) => {
  return dummyStores.find(store => store.id === storeId);
};

export const getDummyProductById = (productId: string) => {
  return dummyProducts.find(product => product.id === productId);
};

export const getDummyProductsByStoreId = (storeId: string) => {
  return dummyProducts.filter(product => product.store_id === storeId);
};

export const getDummyReviewsByProductId = (productId: string) => {
  return dummyReviews.filter(review => review.product_id === productId);
};

export const getFeaturedProducts = () => {
  return dummyProducts.filter(product => product.is_featured);
};

export const getActiveStores = () => {
  return dummyStores.filter(store => store.status === 'active');
};