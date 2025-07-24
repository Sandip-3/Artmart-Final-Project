import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly API_URL = 'http://localhost:5118/api';
  private wishlistItemsSubject = new BehaviorSubject<Product[]>([]);
  public wishlistItems$ = this.wishlistItemsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadWishlist();
      } else {
        this.wishlistItemsSubject.next([]);
      }
    });
  }

  /**
   * Load wishlist items from the API
   * GET /api/Wishlist
   */
  loadWishlist(): Observable<Product[]> {
    if (!this.authService.isAuthenticated()) {
      this.wishlistItemsSubject.next([]);
      return of([]);
    }

    return this.http.get<Product[]>(`${this.API_URL}/Wishlist`)
      .pipe(
        tap(products => this.wishlistItemsSubject.next(products)),
        catchError(error => {
          this.wishlistItemsSubject.next([]);
          return this.handleError(error, 'load wishlist');
        })
      );
  }

  /**
   * Add product to wishlist
   * POST /api/Wishlist/{productId}
   */
  addToWishlist(productId: string): Observable<{message: string}> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User must be logged in'));
    }

    return this.http.post<{message: string}>(`${this.API_URL}/Wishlist/${productId}`, {})
      .pipe(
        tap(() => {
          // Reload wishlist to get updated items
          this.loadWishlist().subscribe();
        }),
        catchError(error => this.handleError(error, 'add item to wishlist'))
      );
  }

  /**
   * Remove product from wishlist
   * DELETE /api/Wishlist/{productId}
   */
  removeFromWishlist(productId: string): Observable<{message: string}> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User must be logged in'));
    }

    return this.http.delete<{message: string}>(`${this.API_URL}/Wishlist/${productId}`)
      .pipe(
        tap(() => {
          // Update local wishlist by removing the item
          const currentItems = this.wishlistItemsSubject.value;
          const updatedItems = currentItems.filter(item => item.id?.toString() !== productId);
          this.wishlistItemsSubject.next(updatedItems);
        }),
        catchError(error => this.handleError(error, 'remove item from wishlist'))
      );
  }

  /**
   * Check if product is in wishlist
   */
  isInWishlist(productId: string): boolean {
    const items = this.wishlistItemsSubject.value;
    return items.some(item => item.id?.toString() === productId);
  }

  /**
   * Get current wishlist items
   */
  getCurrentWishlistItems(): Product[] {
    return this.wishlistItemsSubject.value;
  }

  /**
   * Get number of items in wishlist
   */
  getWishlistItemCount(): number {
    return this.wishlistItemsSubject.value.length;
  }

  /**
   * Clear entire wishlist (if backend supports it)
   * Note: This endpoint doesn't exist in your backend controller
   */
  clearWishlist(): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      return of(undefined);
    }

    // Since there's no clear endpoint in your backend, we'll remove items one by one
    const currentItems = this.getCurrentWishlistItems();
    if (currentItems.length === 0) {
      return of(undefined);
    }

    // Remove all items sequentially
    const removePromises = currentItems.map(item => 
      this.removeFromWishlist(item.id!.toString()).toPromise()
    );

    return new Observable<void>(observer => {
      Promise.all(removePromises)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
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
      return throwError(() => new Error('Access denied. Only customers can access wishlist functionality.'));
    }
    
    // Handle not found errors
    if (error.status === 404) {
      if (operation.includes('remove')) {
        return throwError(() => new Error('Wishlist item not found or already removed.'));
      }
      return throwError(() => new Error('Wishlist API endpoint not found. Please verify the server is running.'));
    }
    
    // Handle method not allowed
    if (error.status === 405) {
      return throwError(() => new Error(`HTTP method not allowed for ${operation}. Please check the API configuration.`));
    }
    
    // Handle bad request
    if (error.status === 400) {
      return throwError(() => new Error('Invalid request data. Please check the product ID.'));
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