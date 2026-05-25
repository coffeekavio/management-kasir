import { api } from './api';

export interface Cashier {
  id: string;
  name: string;
  email: string;
  role: 'kasir' | 'supervisor' | 'manager';
  username: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  detail?: string;
}

interface RawEmployee {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  username: string;
}

export const cashierService = {
  // Fetch semua cashier/employee berdasarkan cafe_id
  getEmployeesByCafe: async (cafeId: string): Promise<Cashier[]> => {
    try {
      const response = await api.get<ApiResponse<RawEmployee[]>>(`/api/users?cafe_id=${cafeId}`);
      
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data.map((emp) => ({
          id: emp.id,
          name: emp.full_name,
          email: emp.email || `${emp.username}@kasir.com`,
          role: emp.role as 'kasir' | 'supervisor' | 'manager',
          username: emp.username
        }));
      }
      
      throw new Error('Gagal memuat data karyawan');
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Tambah cashier/employee baru
  createEmployee: async (payload: {
    email: string;
    password: string;
    username: string;
    full_name: string;
    role: string;
    cafe_id: string;
  }): Promise<{ user_id: string }> => {
    try {
      const response = await api.post<ApiResponse<{ user_id: string }>>('/create-user', payload);
      
      if (response.data.status === 'success') {
        return response.data.data;
      }
      
      throw new Error(response.data.detail || 'Gagal mendaftarkan karyawan baru');
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  // Update/Edit cashier
  updateEmployee: async (
    employeeId: string,
    payload: {
      email: string;
      username: string;
      full_name: string;
      role: string;
      password?: string;
    }
  ): Promise<void> => {
    try {
      const response = await api.put<ApiResponse<unknown>>(`/api/users/${employeeId}`, payload);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.detail || 'Gagal memperbarui data karyawan');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },

  // Delete/Hapus cashier
  deleteEmployee: async (employeeId: string): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<unknown>>(`/api/users/${employeeId}`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.detail || 'Gagal menghapus karyawan');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },
};
