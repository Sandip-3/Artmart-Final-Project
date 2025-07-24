import { Product } from './product.model';

export interface CartItem {
  id: string;  // Changed from number to string to match API (Guid)
  productId: string;
  product: Product;
  quantity: number;
  userId: string;  // Changed from number to string to match API
  addedAt?: string;  // Added to match API model
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

export interface WishlistItem {
  id: number;
  productId: string;
  product: Product;
  userId: number;
  createdAt: string;
}

export interface Wishlist {
  id: number;
  userId: number;
  items: WishlistItem[];
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  productId: string;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
} 