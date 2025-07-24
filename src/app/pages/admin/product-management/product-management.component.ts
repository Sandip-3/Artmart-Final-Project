import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, forkJoin, filter } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { Product, Category } from '../../../models/product.model';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.css']
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  categoryMap: { [key: string]: string } = {};
  loading = false;
  error = '';
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    // Listen for navigation events to reload data when returning to this page
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter((event: NavigationEnd) => event.url === '/admin/products'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Reload data when navigating back to this page
        this.loadData();
      });
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
        this.categories = categories;
        
        // Create category mapping for quick lookup
        this.categoryMap = {};
        categories.forEach(category => {
          this.categoryMap[category.id] = category.name;
        });
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load data';
        this.loading = false;
        console.error('Error loading data:', error);
      }
    });
  }

  getCategoryName(categoryId: string): string {
    return this.categoryMap[categoryId] || 'Unknown Category';
  }

  async deleteProduct(product: Product): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      'Delete Product',
      `Are you sure you want to delete "${product.title}"? This action cannot be undone.`,
      'Delete',
      'Cancel',
      'danger'
    );

    if (confirmed) {
      this.productService.deleteProduct(product.id!.toString())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.products = this.products.filter(p => p.id !== product.id);
            this.toastService.success('Product deleted successfully');
          },
          error: (error) => {
            this.toastService.error('Failed to delete product');
            console.error('Error deleting product:', error);
          }
        });
    }
  }
} 