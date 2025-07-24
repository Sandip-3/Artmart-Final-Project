import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Product, Category } from '../../models/product.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  categoryMap: { [key: string]: string } = {};
  selectedCategory = '';
  searchQuery = '';
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    // Subscribe to wishlist changes for real-time icon updates
    if (this.authService.isAuthenticated() && this.authService.isCustomer()) {
      this.wishlistService.wishlistItems$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          // Trigger change detection when wishlist items change
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    
    // Load both products and categories simultaneously
    forkJoin({
      products: this.productService.getAllProducts(),
      categories: this.categoryService.getAllCategories()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ products, categories }) => {
        this.products = products;
        this.filteredProducts = products;
        this.categories = categories;
        
        // Create category mapping for quick lookup
        this.categoryMap = {};
        categories.forEach(category => {
          this.categoryMap[category.id] = category.name;
        });
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load data. Please try again.';
        this.loading = false;
        console.error('Error loading data:', error);
      }
    });
  }

  getCategoryName(categoryId: string): string {
    return this.categoryMap[categoryId] || 'Unknown Category';
  }

  filterProducts(): void {
    let filtered = [...this.products];

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(product => {
        const categoryName = this.getCategoryName(product.categoryId);
        return categoryName.toLowerCase() === this.selectedCategory.toLowerCase();
      });
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const categoryName = this.getCategoryName(product.categoryId);
        return product.title.toLowerCase().includes(query) ||
               product.description.toLowerCase().includes(query) ||
               categoryName.toLowerCase().includes(query);
      });
    }

    this.filteredProducts = filtered;
  }

  onCategoryChange(): void {
    this.filterProducts();
  }

  onSearchChange(): void {
    this.filterProducts();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.filteredProducts = [...this.products];
  }

  viewProduct(productId: number | undefined): void {
    if (productId) {
      this.router.navigate(['/product', productId]);
    }
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isCustomer()) {
      this.toastService.warning('Only customers can add items to cart');
      return;
    }

    this.cartService.addToCart(product.id!.toString(), 1)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Product added to cart successfully!');
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

  addToWishlist(product: Product, event: Event): void {
    event.stopPropagation();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.isCustomer()) {
      this.toastService.warning('Only customers can add items to wishlist');
      return;
    }

    const productId = product.id!.toString();
    const isCurrentlyInWishlist = this.isInWishlist(productId);

    if (isCurrentlyInWishlist) {
      // Remove from wishlist
      this.wishlistService.removeFromWishlist(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Product removed from wishlist successfully!');
          },
          error: (error) => {
            this.toastService.error('Failed to remove product from wishlist. Please try again.');
          }
        });
    } else {
      // Add to wishlist
      this.wishlistService.addToWishlist(productId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Product added to wishlist successfully!');
          },
          error: (error) => {
            if (error.message === 'Product is already in wishlist') {
              this.toastService.info('Product is already in your wishlist');
            } else {
              this.toastService.error('Failed to add product to wishlist. Please try again.');
            }
          }
        });
    }
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

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }
} 