import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  cartItemCount = 0;
  wishlistItemCount = 0;
  isMenuOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateCounts();
      });

    // Subscribe to cart and wishlist changes
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cartItemCount = this.cartService.getCartItemCount();
      });

    this.wishlistService.wishlistItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.wishlistItemCount = this.wishlistService.getWishlistItemCount();
      });
  }

  private updateCounts(): void {
    this.cartItemCount = this.cartService.getCartItemCount();
    this.wishlistItemCount = this.wishlistService.getWishlistItemCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
    this.closeMenu();
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }
} 