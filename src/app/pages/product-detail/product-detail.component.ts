import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Product, Category } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  categoryName: string = '';
  loading = false;
  error = '';
  quantity = 1;
  isInWishlist = false;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const productId = params['id']; // Keep as string for UUID
      if (productId) {
        this.loadProductAndCategory(productId);
        if (this.authService.isAuthenticated() && this.authService.isCustomer()) {
          this.checkWishlistStatus(productId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProductAndCategory(id: string): void {
    this.loading = true;
    this.error = '';

    // Load product first, then load category based on categoryId
    this.productService.getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product) => {
          this.product = product;
          
          // Load category name if categoryId exists
          if (product.categoryId) {
            this.loadCategoryName(product.categoryId);
          } else {
            this.loading = false;
          }
        },
        error: (error) => {
          this.error = 'Product not found or failed to load.';
          this.loading = false;
          console.error('Error loading product:', error);
        }
      });
  }

  private loadCategoryName(categoryId: string): void {
    this.categoryService.getAllCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          const category = categories.find(cat => cat.id === categoryId);
          this.categoryName = category ? category.name : 'Unknown Category';
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading category:', error);
          this.categoryName = 'Unknown Category';
          this.loading = false;
        }
      });
  }

  checkWishlistStatus(productId: string): void {
    this.isInWishlist = this.wishlistService.isInWishlist(productId);
  }

  increaseQuantity(): void {
    this.quantity++;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isCustomer()) {
      this.toastService.warning('Only customers can add items to cart');
      return;
    }

    // Show loading state
    const originalButtonText = 'Add to Cart';
    
    this.cartService.addToCart(this.product.id!.toString(), this.quantity)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success(`${this.quantity} item(s) added to cart successfully!`);
          this.quantity = 1; // Reset quantity
        },
        error: (error) => {
          console.error('Error adding to cart:', error);
          
          // Provide more specific error messages
          if (error.message && error.message.includes('Cart API endpoint not found')) {
            this.toastService.warning('Cart functionality is not available yet. The Cart API needs to be implemented on the server.');
          } else if (error.status === 404) {
            this.toastService.warning('Cart service is not available. Please check if the Cart API is running on the server.');
          } else if (error.status === 401) {
            this.toastService.error('Please log in again to add items to cart.');
            this.router.navigate(['/login']);
          } else {
            this.toastService.error('Failed to add product to cart. Please try again later.');
          }
        }
      });
  }

  toggleWishlist(): void {
    if (!this.product) return;

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isCustomer()) {
      this.toastService.warning('Only customers can manage wishlist');
      return;
    }

    if (this.isInWishlist) {
      this.removeFromWishlist();
    } else {
      this.addToWishlist();
    }
  }

  private addToWishlist(): void {
    if (!this.product) return;

    this.wishlistService.addToWishlist(this.product.id!.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isInWishlist = true;
          this.toastService.success('Product added to wishlist successfully!');
        },
        error: (error) => {
          this.toastService.error('Failed to add product to wishlist. Please try again.');
        }
      });
  }

  private removeFromWishlist(): void {
    if (!this.product) return;

    this.wishlistService.removeFromWishlist(this.product.id!.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isInWishlist = false;
          this.toastService.success('Product removed from wishlist successfully!');
        },
        error: (error) => {
          this.toastService.error('Failed to remove product from wishlist. Please try again.');
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goBackToAdminProducts(): void {
    this.router.navigate(['/admin/products']);
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  getStarArray(rating: number | undefined): boolean[] {
    const stars: boolean[] = [];
    const safeRating = rating || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.floor(safeRating));
    }
    return stars;
  }

  getSavingsPercentage(): number {
    if (this.product?.originalPrice && this.product?.price) {
      return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
    }
    return 0;
  }
} 