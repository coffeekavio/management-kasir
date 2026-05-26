import { api } from './api';

export interface Category {
  id: string;
  cafe_id: string;
  name: string;
  created_at?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost?: number;
}

export interface RecipeItemInput {
  ingredientId: string;
  quantity: number;
}

export interface Menu {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  trackStock: boolean;
  recipe?: RecipeItemInput[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  detail?: string;
}

export const menuService = {
  // Fetch semua kategori berdasarkan cafe_id
  getCategories: async (cafeId: string): Promise<Category[]> => {
    try {
      const response = await api.get<ApiResponse<Category[]>>(
        `/api/kategori/?cafe_id=${cafeId}`
      );

      // Backend returns ApiResponse structure dengan data array di dalamnya
      const data = response.data.data || [];
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Fetch semua ingredients berdasarkan cafe_id
  getIngredients: async (cafeId: string): Promise<Ingredient[]> => {
    try {
      const response = await api.get<ApiResponse<Ingredient[]>>(
        `/api/ingredients/?cafe_id=${cafeId}`
      );

      if (response.data.data) {
        return response.data.data;
      }

      throw new Error('Gagal memuat data bahan baku');
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      throw error;
    }
  },

  // Fetch semua menus berdasarkan cafe_id
  getMenus: async (cafeId: string): Promise<Menu[]> => {
    try {
      interface RecipeIngredient {
        ingredient_id?: string;
        ingredientId?: string;
        quantity?: number;
      }

      interface MenuResponse {
        id: string;
        name: string;
        description?: string;
        price?: number;
        category_id?: string;
        categoryId?: string;
        is_available?: boolean;
        track_stock?: boolean;
        recipe_ingredients?: RecipeIngredient[];
      }

      const response = await api.get<ApiResponse<MenuResponse[]>>(
        `/api/menus/?cafe_id=${cafeId}`
      );

      const mappedMenus = (response.data.data || []).map((m: MenuResponse) => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        price: m.price || 0,
        categoryId: m.category_id || m.categoryId || '',
        isAvailable: m.is_available !== false,
        trackStock: m.track_stock === true,
        recipe: m.recipe_ingredients
          ? m.recipe_ingredients.map((r: RecipeIngredient) => ({
              ingredientId: r?.ingredient_id || r?.ingredientId || '',
              quantity: r?.quantity || 0,
            }))
          : [],
      }));

      return mappedMenus;
    } catch (error) {
      console.error('Error fetching menus:', error);
      throw error;
    }
  },

  // Tambah kategori baru
  createCategory: async (cafeId: string, name: string): Promise<Category> => {
    try {
      console.log('Creating category with:', { cafe_id: cafeId, name });
      
      const response = await api.post<ApiResponse<Category>>('/api/kategori/category-create', {
        cafe_id: cafeId,
        name,
      });

      console.log('Category response:', response.data);
      
      // Backend returns ApiResponse structure
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      // Jika response tidak ada data tapi status 200/201, ambil category dari respons
      if (response.status === 201 || response.status === 200) {
        if (Array.isArray(response.data.data)) {
          return response.data.data[0];
        }
        if (response.data.data) {
          return response.data.data;
        }
      }

      throw new Error(response.data.detail || 'Gagal menambah kategori');
    } catch (error) {
      console.error('Error creating category:', error);
      // Re-throw dengan informasi yang lebih jelas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(String(error));
    }
  },

  // Update kategori
  updateCategory: async (categoryId: string, name: string, cafeId?: string | null): Promise<Category> => {
    try {
      console.log('Updating category with:', { id: categoryId, name, cafe_id: cafeId });
      
      // Backend requires cafe_id as query parameter
      const url = cafeId 
        ? `/api/kategori/update/${categoryId}?cafe_id=${cafeId}`
        : `/api/kategori/update/${categoryId}`;
      
      const response = await api.put<ApiResponse<Category>>(url, {
        name,
      });

      console.log('Update category response:', response.data);
      
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      if (response.status === 200) {
        return response.data.data;
      }

      throw new Error(response.data.detail || 'Gagal memperbarui kategori');
    } catch (error) {
      console.error('Error updating category:', error);
      
      // Extract better error message
      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response !== null) {
          const resp = error.response as any;
          console.error('Response error details:', resp.data);
        }
      }
      
      throw error;
    }
  },

  // Delete kategori
  deleteCategory: async (categoryId: string, cafeId?: string | null): Promise<void> => {
    try {
      console.log('Deleting category:', categoryId, 'cafe_id:', cafeId);
      
      // Backend requires cafe_id as query parameter
      const url = cafeId
        ? `/api/kategori/delete/${categoryId}?cafe_id=${cafeId}`
        : `/api/kategori/delete/${categoryId}`;
      
      const response = await api.delete<ApiResponse<unknown>>(url);

      console.log('Delete category response:', response.data);
      
      if (response.data.status === 'success' || response.status === 200) {
        return;
      }

      throw new Error(response.data.detail || 'Gagal menghapus kategori');
    } catch (error) {
      console.error('Error deleting category:', error);
      
      // Extract better error message
      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response !== null) {
          const resp = error.response as any;
          console.error('Response error details:', resp.data);
        }
      }
      
      throw error;
    }
  },

  // Tambah menu baru
  createMenu: async (payload: {
    cafe_id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    is_available: boolean;
    track_stock: boolean;
    recipe: Array<{
      ingredient_id: string;
      quantity: number;
    }>;
  }): Promise<Menu> => {
    try {
      console.log('Creating menu with payload:', payload);
      
      // Endpoint yang benar sesuai backend FastAPI
      const response = await api.post<ApiResponse<Menu>>(
        '/api/menus/create-menus',
        payload
      );

      console.log('Create menu response:', response.data);

      if (response.data.status === 'success' || response.status === 201 || response.status === 200) {
        // Backend mengembalikan success message, bukan data object
        // Jadi kita return payload sebagai Menu object
        return {
          id: Math.random().toString(), // ID akan di-set oleh backend
          name: payload.name,
          description: payload.description || '',
          price: payload.price,
          categoryId: payload.category_id,
          isAvailable: payload.is_available,
          trackStock: payload.track_stock,
          recipe: payload.recipe.map((r) => ({
            ingredientId: r.ingredient_id,
            quantity: r.quantity,
          })),
        };
      }

      throw new Error(response.data.detail || 'Gagal menambah menu');
    } catch (error) {
      console.error('Error creating menu:', error);
      
      // Extract better error message
      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response !== null) {
          const resp = error.response as any;
          console.error('Response error details:', resp.status, resp.data);
        }
      }
      
      throw error;
    }
  },

  // Update/Edit menu
  updateMenu: async (
    menuId: string,
    payload: {
      cafe_id: string;
      category_id: string;
      name: string;
      description: string | null;
      price: number;
      is_available: boolean;
      track_stock: boolean;
      recipe: Array<{
        ingredient_id: string;
        quantity: number;
      }>;
    }
  ): Promise<Menu> => {
    try {
      const response = await api.put<ApiResponse<Menu>>(`/api/menus/${menuId}`, payload);

      if (response.data.data || response.status === 200) {
        return response.data.data;
      }

      throw new Error(response.data.detail || 'Gagal memperbarui menu');
    } catch (error) {
      console.error('Error updating menu:', error);
      throw error;
    }
  },

  // Delete/Hapus menu
  deleteMenu: async (menuId: string): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<unknown>>(`/api/menus/${menuId}`);

      if (response.data.status !== 'success' && response.status !== 200) {
        throw new Error(response.data.detail || 'Gagal menghapus menu');
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  },
};
