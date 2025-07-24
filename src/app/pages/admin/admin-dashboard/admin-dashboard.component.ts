import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, filter } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { Category, Product } from '../../../models/product.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  totalProducts = 0;
  totalRevenue = 0;
  totalCategories = 0;
  activeUsers = 0;
  loading = false;
  categories: Category[] = [];
  products: Product[] = [];
  newCategoryName = '';
  categoryLoading = false;
  categoryError = '';
  showAddCategory = false;
  private destroy$ = new Subject<void>();

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Listen for navigation events to reload data when returning to this page
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter((event: NavigationEnd) => event.url === '/admin' || event.url === '/admin/dashboard'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Reload data when navigating back to this page
        this.loadDashboardData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load products and categories simultaneously
    forkJoin({
      products: this.productService.getAllProducts(),
      categories: this.categoryService.getAllCategories()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ products, categories }) => {
        this.products = products;
        this.categories = categories;
        
        // Calculate stats
        this.totalProducts = products.length;
        this.totalCategories = categories.length;
        this.calculateRevenue();
        this.calculateActiveUsers();
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    });
  }

  private calculateRevenue(): void {
    // Calculate total revenue based on product prices
    // This is a simplified calculation - in a real app, you'd get this from orders/sales data
    this.totalRevenue = this.products.reduce((total, product) => {
      // Simulate some sales by using a random factor (in real app, this would come from actual sales data)
      const estimatedSales = Math.floor(Math.random() * 10) + 1; // 1-10 sales per product
      return total + (product.price * estimatedSales);
    }, 0);
  }

  private calculateActiveUsers(): void {
    // Simulate active users count
    // In a real app, this would come from user activity tracking or user service
    this.activeUsers = Math.floor(Math.random() * 50) + 25; // Random between 25-75
  }

  refreshStats(): void {
    this.loadDashboardData();
  }

  toggleAddCategory(): void {
    this.showAddCategory = !this.showAddCategory;
    this.newCategoryName = '';
    this.categoryError = '';
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) {
      this.categoryError = 'Category name is required';
      return;
    }

    // Check if category already exists
    if (this.categories.some(cat => cat.name.toLowerCase() === this.newCategoryName.toLowerCase())) {
      this.categoryError = 'Category already exists';
      return;
    }

    this.categoryLoading = true;
    this.categoryError = '';

    this.categoryService.createCategory({ name: this.newCategoryName.trim() })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCategory) => {
          this.categories.push(newCategory);
          this.totalCategories = this.categories.length;
          this.newCategoryName = '';
          this.showAddCategory = false;
          this.categoryLoading = false;
          this.toastService.success('Category created successfully');
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.categoryError = 'Failed to create category. Please try again.';
          this.categoryLoading = false;
          this.toastService.error('Failed to create category. Please try again.');
        }
      });
  }

  async deleteCategory(categoryId: string, categoryName: string): Promise<void> {
    const confirmed = await this.confirmationService.confirm(
      'Delete Category',
      `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`,
      'Delete',
      'Cancel',
      'danger'
    );

    if (!confirmed) {
      return;
    }

    this.categoryService.deleteCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.categories = this.categories.filter(cat => cat.id !== categoryId);
          this.totalCategories = this.categories.length;
          this.toastService.success('Category deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.toastService.error('Failed to delete category. Please try again.');
        }
      });
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  // Format currency for display
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
} 