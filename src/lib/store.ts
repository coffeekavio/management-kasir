import { create } from 'zustand';
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

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  activeCafeId: null,
  cafeList: [],
  login: (user: User) => {
    set({ user, isAuthenticated: true, activeCafeId: user.cafe_id || null });
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, activeCafeId: null, cafeList: [] });
    localStorage.removeItem('user');
  },
  setUser: (user: User) => {
    set({ user, isAuthenticated: true, activeCafeId: user.cafe_id || null });
  },
  setActiveCafeId: (cafeId: string | null) => {
    set({ activeCafeId: cafeId });
    if (cafeId) localStorage.setItem('activeCafeId', cafeId);
  },
  setCafeList: (cafes: Cafe[]) => {
    set({ cafeList: cafes });
  },
}));
