import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { UserGuard } from './guards/user.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent),
    canActivate: [UserGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'admin/products',
    loadComponent: () => import('./pages/admin/product-management/product-management.component').then(m => m.ProductManagementComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'admin/products/new',
    loadComponent: () => import('./pages/admin/product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [AdminGuard]
  },
  {
    path: 'admin/products/edit/:id',
    loadComponent: () => import('./pages/admin/product-form/product-form.component').then(m => m.ProductFormComponent),
    canActivate: [AdminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
