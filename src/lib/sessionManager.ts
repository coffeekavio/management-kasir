// src/lib/sessionManager.ts
import { api } from '@/services/api';
import { useAuthStore } from './store';
import { AuthUser } from '@/services/authService';

/**
 * Restore session dari token yang tersimpan
 * Dijalankan saat aplikasi dimulai (di root layout)
 */
export const restoreSession = async (): Promise<boolean> => {
  try {
    // Cek apakah token ada di localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    // Validasi token ke server dengan endpoint yang ada
    // Jika tidak ada endpoint khusus, kita bisa anggap token valid jika ada
    // dan restore user dari Zustand store (yang sekarang persistent)
    
    // Zustand persist middleware otomatis restore data dari localStorage saat create,
    // jadi kita tidak perlu melakukan apa-apa manual di sini.
    // Cukup check apakah user data sudah ada di store
    
    const state = useAuthStore.getState();
    if (state.user && state.isAuthenticated) {
      console.log('Session restored from localStorage:', state.user.email);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to restore session:', error);
    return false;
  }
};

/**
 * Validasi token dengan server
 * Optional: Gunakan ini jika ada endpoint khusus untuk validasi token
 */
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Coba call endpoint yang memerlukan authentication
    // Jika response 401, berarti token invalid/expired
    const response = await api.get('/api/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.status === 200;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token expired atau invalid
      useAuthStore.getState().logout();
      localStorage.removeItem('token');
    }
    return false;
  }
};

/**
 * Clear session (logout)
 */
export const clearSession = (): void => {
  localStorage.removeItem('token');
  useAuthStore.getState().logout();
};
