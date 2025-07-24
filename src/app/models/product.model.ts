export interface Product {
  id?: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  categoryId: string;
  stock?: number;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isSale?: boolean;
  createdAt?: string;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
}

export interface UpdateProductRequest {
  id?: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Rating {
  id: number;
  productId: string;
  userId: number;
  rating: number;
  review?: string;
  createdAt: string;
} 