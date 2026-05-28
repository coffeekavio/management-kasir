import { api } from './api';
import type { ApiResponse, Voucher, VoucherCreatePayload, VoucherUpdatePayload } from '@/types';

export const voucherService = {
  getVouchersByCafe: async (cafeId: string): Promise<Voucher[]> => {
    try {
      const response = await api.get<ApiResponse<Voucher[]>>(`/api/vouchers/all/${cafeId}`);

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      throw new Error('Gagal memuat data voucher');
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      throw error;
    }
  },

  createVoucher: async (payload: VoucherCreatePayload): Promise<Voucher> => {
    try {
      const response = await api.post<ApiResponse<Voucher>>('/api/vouchers', payload);

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Gagal membuat voucher');
    } catch (error) {
      console.error('Error creating vouchers:', error);
      throw error;
    }
  },

  updateVoucher: async (voucherId: string, payload: VoucherUpdatePayload): Promise<Voucher> => {
    try {
      const response = await api.put<ApiResponse<Voucher>>(`/api/vouchers/${voucherId}`, payload);

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Gagal memperbarui voucher');
    } catch (error) {
      console.error('Error updating voucher:', error);
      throw error;
    }
  },

  deleteVoucher: async (voucherId: string): Promise<void> => {
    try {
      const response = await api.delete<ApiResponse<unknown>>(`/api/vouchers/${voucherId}`);

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Gagal menghapus voucher');
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      throw error;
    }
  },
};