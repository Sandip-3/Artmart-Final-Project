import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isCustomer()) {
      return true;
    }
    
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      // Admin trying to access user routes, redirect to admin dashboard
      this.router.navigate(['/admin']);
    } else {
      // User not logged in, redirect to login
      this.router.navigate(['/login']);
    }
    
    return false;
  }
} 