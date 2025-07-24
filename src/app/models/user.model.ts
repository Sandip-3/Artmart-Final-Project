export interface User {
  id?: number;
  username: string;
  role: 'Customer' | 'Admin';
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: 'Customer' | 'Admin';
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
} 