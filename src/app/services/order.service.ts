import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Order } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly API_URL = 'http://localhost:5118/api';

  constructor(private http: HttpClient) {}

  placeOrder(): Observable<Order> {
    return this.http.post<Order>(`${this.API_URL}/Order/place`, {})
      .pipe(
        catchError(error => {
          console.error('Error placing order:', error);
          return throwError(() => error);
        })
      );
  }

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API_URL}/Order/my`)
      .pipe(
        catchError(error => {
          console.error('Error fetching orders:', error);
          return throwError(() => error);
        })
      );
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.API_URL}/Order/${orderId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching order:', error);
          return throwError(() => error);
        })
      );
  }
} 