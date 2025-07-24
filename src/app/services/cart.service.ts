import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';

export interface AddToCartDto {
  ProductId: string;
  Quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly API_URL = 'http://localhost:5118/api';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Load cart when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadCart();
      } else {
        this.cartItemsSubject.next([]);
      }
    });
  }

  /**
   * Load cart items from the API
   * GET /api/Cart
   */
  loadCart(): Observable<CartItem[]> {
    if (!this.authService.isAuthenticated()) {
      this.cartItemsSubject.next([]);
      return of([]);
    }

    return this.http.get<CartItem[]>(`${this.API_URL}/Cart`)
      .pipe(
        tap(items => this.cartItemsSubject.next(items)),
        catchError(error => {
          this.cartItemsSubject.next([]);
          return this.handleError(error, 'load cart');
        })
      );
  }

  /**
   * Add item to cart
   * POST /api/Cart
   */
  addToCart(productId: string, quantity: number = 1): Observable<CartItem> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User must be logged in to add items to cart'));
    }

    const addToCartDto: AddToCartDto = {
      ProductId: productId,
      Quantity: quantity
    };
    
    return this.http.post<CartItem>(`${this.API_URL}/Cart`, addToCartDto)
      .pipe(
        tap(() => {
          // Reload cart to get updated items
          this.loadCart().subscribe();
        }),
        catchError(error => this.handleError(error, 'add item to cart'))
      );
  }

  /**
   * Remove item from cart
   * DELETE /api/Cart/{productId}
   */
  removeFromCart(productId: string): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User must be logged in'));
    }

    return this.http.delete<void>(`${this.API_URL}/Cart/${productId}`)
      .pipe(
        tap(() => {
          // Update local cart by removing the item
          const currentItems = this.cartItemsSubject.value;
          const updatedItems = currentItems.filter(item => item.productId !== productId);
          this.cartItemsSubject.next(updatedItems);
        }),
        catchError(error => this.handleError(error, 'remove item from cart'))
      );
  }

  /**
   * Update cart item quantity
   * Since backend doesn't have PUT endpoint, we'll add/update using POST
   */
  updateCartItem(productId: string, quantity: number): Observable<CartItem> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User must be logged in'));
    }

    if (quantity <= 0) {
      return this.removeFromCart(productId).pipe(
        map(() => {
          // Return a dummy CartItem since removeFromCart returns void
          return {} as CartItem;
        })
      );
    }

    // Since there's no PUT endpoint, we'll add/update using POST
    // The backend AddOrUpdateCartItemAsync should handle existing items
    return this.addToCart(productId, quantity);
  }

  /**
   * Clear entire cart
   * DELETE /api/Cart/clear
   */
  clearCart(): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return of(undefined);
    }

    return this.http.delete<void>(`${this.API_URL}/Cart/clear`)
      .pipe(
        tap(() => this.cartItemsSubject.next([])),
        catchError(error => this.handleError(error, 'clear cart'))
      );
  }

  /**
   * Get current cart items
   */
  getCurrentCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  /**
   * Get total number of items in cart
   */
  getCartItemCount(): number {
    const items = this.cartItemsSubject.value;
    return items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Get total amount of cart
   */
  getCartTotal(): number {
    const items = this.cartItemsSubject.value;
    return items.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }

  /**
   * Check if product is in cart
   */
  isProductInCart(productId: string): boolean {
    const items = this.cartItemsSubject.value;
    return items.some(item => item.productId === productId);
  }

  /**
   * Get quantity of specific product in cart
   */
  getProductQuantityInCart(productId: string): number {
    const items = this.cartItemsSubject.value;
    const item = items.find(item => item.productId === productId);
    return item?.quantity || 0;
  }

  /**
   * Centralized error handling
   */
  private handleError(error: any, operation: string): Observable<never> {
    // Handle CORS errors
    if (error.status === 0) {
      return throwError(() => new Error('Unable to connect to the server. Please ensure the API server is running and CORS is properly configured.'));
    }
    
    // Handle authentication errors
    if (error.status === 401) {
      return throwError(() => new Error('Authentication failed. Please log out and log in again.'));
    }
    
    // Handle authorization errors
    if (error.status === 403) {
      return throwError(() => new Error('Access denied. Only customers can access cart functionality.'));
    }
    
    // Handle not found errors
    if (error.status === 404) {
      if (operation.includes('remove')) {
        return throwError(() => new Error('Cart item not found or already removed.'));
      }
      return throwError(() => new Error('Cart API endpoint not found. Please verify the server is running.'));
    }
    
    // Handle method not allowed
    if (error.status === 405) {
      return throwError(() => new Error(`HTTP method not allowed for ${operation}. Please check the API configuration.`));
    }
    
    // Handle bad request
    if (error.status === 400) {
      return throwError(() => new Error('Invalid request data. Please check the product ID and quantity.'));
    }

    // Handle server errors
    if (error.status >= 500) {
      return throwError(() => new Error(`Server error occurred while trying to ${operation}. Please try again later.`));
    }
    
    // Generic error
    const errorMessage = error.error?.message || error.message || 'Unknown error';
    return throwError(() => new Error(`Failed to ${operation}: ${errorMessage}`));
  }
} 