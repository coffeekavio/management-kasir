import { create } from 'zustand';
import { persist, StorageValue } from 'zustand/middleware';
import { User } from '@/types';

export interface Cafe {
  id: string;
  name: string;
  manager_id: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  activeCafeId: string | null; // Cabang/Kafe yang sedang dipilih
  cafeList: Cafe[]; // Daftar kafe milik manager
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setActiveCafeId: (cafeId: string | null) => void;
  setCafeList: (cafes: Cafe[]) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeCafeId: null,
      cafeList: [],
      login: (user: User) => {
        set({ user, isAuthenticated: true, activeCafeId: user.cafe_id || null });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, activeCafeId: null, cafeList: [] });
      },
      setUser: (user: User) => {
        set({ user, isAuthenticated: true, activeCafeId: user.cafe_id || null });
      },
      setActiveCafeId: (cafeId: string | null) => {
        set({ activeCafeId: cafeId });
      },
      setCafeList: (cafes: Cafe[]) => {
        set({ cafeList: cafes });
      },
    }),
    {
      name: 'auth-storage', // Nama key di localStorage
      storage: typeof window !== 'undefined' 
        ? {
            getItem: (key: string) => {
              try {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
              } catch {
                return null;
              }
            },
            setItem: (key: string, value: StorageValue<AuthStore>) => {
              try {
                window.localStorage.setItem(key, JSON.stringify(value));
              } catch {
                console.warn('Failed to save to localStorage');
              }
            },
            removeItem: (key: string) => {
              try {
                window.localStorage.removeItem(key);
              } catch {
                console.warn('Failed to remove from localStorage');
              }
            },
          }
        : undefined,
    }
  )
);
