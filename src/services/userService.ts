// src/services/userService.ts
import { api } from "./api";
import type { ApiResponse, User } from "@/types";

export interface UserPayload {
  email?: string;
  password?: string;
  username?: string;
  full_name?: string;
  role?: string;
  cafe_id?: string;
}

export interface EmployeeData extends User {
  username?: string;
  full_name?: string;
}

export const userService = {
  // GET: Mengambil data karyawan yang hanya berada di bawah naungan cafe milik Manager aktif
  getEmployees: async (managerId: string) => {
    return await api.get<ApiResponse<EmployeeData[]>>(`/api/users?manager_id=${managerId}`);
  },

  // POST: Mendaftarkan karyawan baru dengan mengunci relasi cafe_id
  createEmployee: async (data: UserPayload) => {
    return await api.post<ApiResponse<EmployeeData>>("/create-user", data);
  },

  // PUT: Memperbarui data karyawan
  updateEmployee: async (userId: string, data: UserPayload) => {
    return await api.put<ApiResponse<EmployeeData>>(`/api/users/${userId}`, data);
  },

  // DELETE: Menghapus akun karyawan dari sistem
  deleteEmployee: async (userId: string) => {
    return await api.delete<ApiResponse<void>>(`/api/users/${userId}`);
  }
};