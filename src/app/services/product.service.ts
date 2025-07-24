import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product, CreateProductRequest, UpdateProductRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = 'http://localhost:5118/api';

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API_URL}/Product`)
      .pipe(
        catchError(error => {
          console.error('Error fetching products:', error);
          return throwError(() => error);
        })
      );
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API_URL}/Product/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching product:', error);
          return throwError(() => error);
        })
      );
  }

  createProduct(product: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.API_URL}/Product`, product)
      .pipe(
        catchError(error => {
          console.error('Error creating product:', error);
          return throwError(() => error);
        })
      );
  }

  updateProduct(id: string, product: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.API_URL}/Product/${id}`, product)
      .pipe(
        catchError(error => {
          console.error('Error updating product:', error);
          return throwError(() => error);
        })
      );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/Product/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting product:', error);
          return throwError(() => error);
        })
      );
  }


} 