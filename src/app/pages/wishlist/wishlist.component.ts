import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit, OnDestroy {
  wishlistItems: Product[] = [];
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadWishlist();
    
    // Subscribe to wishlist changes
    this.wishlistService.wishlistItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.wishlistItems = items;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWishlist(): void {
    this.loading = true;
    this.error = '';
    
    this.wishlistService.loadWishlist()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.wishlistItems = items;
          this.loading = false;
        },
        error: (error) => {
          // Provide specific error messages based on the error type
          if (error.status === 0) {
            this.error = 'Unable to connect to the server. Please check if the API server is running and try again.';
          } else if (error.status === 401) {
            this.error = 'Authentication failed. Please log out and log in again.';
          } else if (error.status === 403) {
            this.error = 'Access denied. Only customers can access wishlist functionality.';
          } else if (error.status === 404) {
            this.error = 'Wishlist API endpoint not found. Please verify the server is running.';
          } else {
            this.error = error.message || 'Failed to load wishlist. Please try again.';
          }
          
          this.loading = false;
        }
      });
  }

  removeFromWishlist(product: Product): void {
    this.wishlistService.removeFromWishlist(product.id!.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Item removed from wishlist successfully');
        },
        error: (error) => {
          // Provide specific error messages based on the error type
          if (error.status === 405) {
            this.toastService.error('Server configuration issue: DELETE method not allowed. Please check web.config.');
          } else if (error.status === 401) {
            this.toastService.error('Authentication failed. Please log in again.');
          } else if (error.status === 404) {
            this.toastService.warning('Item not found in wishlist.');
          } else {
            this.toastService.error('Failed to remove item from wishlist. Please try again.');
          }
        }
      });
  }

  addToCart(product: Product): void {
    this.cartService.addToCart(product.id!.toString(), 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Item added to cart successfully!');
        },
        error: (error) => {
          if (error.status === 401) {
            this.toastService.error('Please log in to add items to cart.');
          } else {
            this.toastService.error('Failed to add item to cart. Please try again.');
          }
        }
      });
  }

  async clearWishlist(): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      'Clear Wishlist',
      'Are you sure you want to clear your wishlist? This action cannot be undone.',
      'Clear Wishlist',
      'Cancel',
      'danger'
    );

    if (confirmed) {
      this.wishlistService.clearWishlist()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Wishlist cleared successfully');
          },
          error: (error) => {
            this.toastService.error('Failed to clear wishlist. Please try again.');
          }
        });
    }
  }

  getStarArray(rating: number | undefined): boolean[] {
    const stars: boolean[] = [];
    const safeRating = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(safeRating));
    }
    return stars;
  }
} 