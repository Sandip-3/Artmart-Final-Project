import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Category } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly API_URL = 'http://localhost:5118/api';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.API_URL}/Category`)
      .pipe(
        catchError(error => {
          console.error('Error fetching categories:', error);
          return throwError(() => error);
        })
      );
  }

  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    return this.http.post<Category>(`${this.API_URL}/Category`, category)
      .pipe(
        catchError(error => {
          console.error('Error creating category:', error);
          return throwError(() => error);
        })
      );
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/Category/${categoryId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting category:', error);
          return throwError(() => error);
        })
      );
  }
} 