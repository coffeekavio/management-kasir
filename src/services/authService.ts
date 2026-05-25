// src/services/authService.ts
import { api } from './api';
import { useAuthStore } from '@/lib/store';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'kasir' | 'supervisor' | 'manager';
  cafe_id?: string; // TAMBAHAN: Simpan ID Kafe
  createdAt: Date;
}

interface LoginResponse {
  status: 'success' | 'error';
  user: {
    id: string;
    name: string;
    email: string;
    role: 'kasir' | 'supervisor' | 'manager';
    cafe_id?: string; // TAMBAHAN: Terima ID Kafe dari API
  };
  token: string;
  detail?: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const response = await api.post<LoginResponse>('/api/auth/login', payload);
    const data = response.data;

    console.log('Login Response dari API:', data);

    if (data.status !== 'success' || !data.user) {
      throw new Error('Respons data dari server tidak valid.');
    }

    if (data.user.role !== 'manager') {
      throw new Error('Hanya akun dengan role manager yang dapat mengakses website ini.');
    }

    // Simpan token ke localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    const user = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      cafe_id: data.user.cafe_id || '', // Handle undefined cafe_id
      createdAt: new Date(),
    };

    console.log('Login berhasil:', { userId: user.id, email: user.email, role: user.role });
    
    // Set ke Zustand store (user data disimpan di store, bukan localStorage)
    useAuthStore.getState().login(user);
    
    // Jika ada cafe_id, set ke activeCafeId
    if (user.cafe_id) {
      useAuthStore.getState().setActiveCafeId(user.cafe_id);
    }

    console.log('Store state:', useAuthStore.getState());

    return user;
  },

  logout: (): void => {
    localStorage.removeItem('token');
    useAuthStore.getState().logout();
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  getUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};