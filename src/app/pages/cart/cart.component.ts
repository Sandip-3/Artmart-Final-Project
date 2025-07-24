import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadCart();
    
    // Subscribe to cart changes
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCart(): void {
    this.loading = true;
    this.error = '';
    
    // Check authentication before making the request
    if (!this.authService.isAuthenticated()) {
      this.error = 'Please log in to view your cart';
      this.loading = false;
      return;
    }
    
    this.cartService.loadCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.cartItems = items;
          this.loading = false;
        },
        error: (error) => {
          // Provide more specific error messages based on the error
          if (error.status === 0) {
            this.error = 'Unable to connect to the server. Please check if the API server is running and try again.';
          } else if (error.status === 401) {
            this.error = 'Authentication failed. Please log out and log in again.';
          } else if (error.status === 403) {
            this.error = 'Access denied. Only customers can access cart functionality.';
          } else if (error.status === 404) {
            this.error = 'Cart API endpoint not found. Please verify the server is running.';
          } else {
            this.error = error.message || 'Failed to load cart. Please try again.';
          }
          
          this.loading = false;
        }
      });
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(item);
      return;
    }

    this.cartService.updateCartItem(item.productId, quantity)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Cart items will be updated via the cartItems$ subscription
        },
        error: (error) => {
          this.toastService.error('Failed to update item quantity');
        }
      });
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Item removed from cart successfully');
        },
        error: (error) => {
          // Provide specific error messages based on the error type
          if (error.status === 405) {
            this.toastService.error('Server configuration issue: DELETE method not allowed. Please check web.config.');
          } else if (error.status === 401) {
            this.toastService.error('Authentication failed. Please log in again.');
          } else if (error.status === 404) {
            this.toastService.warning('Item not found in cart.');
          } else {
            this.toastService.error('Failed to remove item from cart. Please try again.');
          }
        }
      });
  }

  async clearCart(): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      'Clear Cart',
      'Are you sure you want to clear your cart? This action cannot be undone.',
      'Clear Cart',
      'Cancel',
      'danger'
    );

    if (confirmed) {
      this.cartService.clearCart()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Cart cleared successfully');
          },
          error: (error) => {
            if (error.status === 405) {
              this.toastService.error('Server configuration issue: DELETE method not allowed. Please check web.config.');
            } else {
              this.toastService.error('Failed to clear cart. Please try again.');
            }
          }
        });
    }
  }

  /**
   * Add a refresh button to manually sync with server
   */
  refreshCart(): void {
    this.loadCart();
  }

  get itemCount(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  get subtotal(): number {
    return this.cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  }

  get shipping(): number {
    return this.subtotal > 50 ? 0 : 10;
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  getQuantityOptions(stock: number | undefined): number[] {
    const safeStock = stock ?? 0;
    const maxQuantity = Math.min(safeStock, 10);
    return Array.from({ length: maxQuantity }, (_, i) => i + 1);
  }
} 