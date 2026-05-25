import { api } from './api';

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  cost: number;
  cafe_id: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  detail?: string;
}

export const ingredientService = {
  // Fetch semua ingredients berdasarkan cafe_id
  getIngredientsByCafe: async (cafeId: string): Promise<Ingredient[]> => {
    try {
      const response = await api.get<ApiResponse<Ingredient[]>>(
        `/api/ingredients/?cafe_id=${cafeId}`
      );

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      throw new Error('Gagal memuat data bahan baku');
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  },

  // Tambah ingredient baru
  createIngredient: async (payload: {
    cafe_id: string;
    name: string;
    stock: number;
    unit: string;
    cost: number;
  }): Promise<Ingredient> => {
    try {
      const response = await api.post<ApiResponse<Ingredient>>(
        '/api/ingredients/',
        payload
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      throw new Error(response.data.detail || 'Gagal menambah bahan baku');
    } catch (error) {
      console.error('Error creating ingredient:', error);
      throw error;
    }
  },

  // Update/Edit ingredient
  updateIngredient: async (
    ingredientId: string,
    payload: {
      cafe_id: string;
      name: string;
      stock: number;
      unit: string;
      cost: number;
    }
  ): Promise<Ingredient> => {
    try {
      const response = await api.put<ApiResponse<Ingredient>>(
        `/api/ingredients/${ingredientId}`,
        payload
      );

      if (response.data.status === 'success') {
        return response.data.data;
      }

      throw new Error(response.data.detail || 'Gagal memperbarui bahan baku');
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  },

  // Delete/Hapus ingredient
  deleteIngredient: async (ingredientId: string): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<unknown>>(
        `/api/ingredients/${ingredientId}`
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.detail || 'Gagal menghapus bahan baku');
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      throw error;
    }
  },
};
