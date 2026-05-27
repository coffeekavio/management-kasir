import { api } from './api';

export interface MemberSettings {
  id: string;
  cafe_id: string;
  earning_amount: number;
  earning_points: number;
  redemption_points: number;
  redemption_discount: number;
  created_at?: string;
  updated_at?: string;
}

export interface MemberSettingsPayload {
  cafe_id: string;
  earning_amount: number;
  earning_points: number;
  redemption_points: number;
  redemption_discount: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  detail?: string;
}

export const memberSettingsService = {
  getSettings: async (cafeId: string): Promise<MemberSettings> => {
    try {
      // DIREVISI: Menggunakan Path Parameter sesuai FastAPI
      const response = await api.get<ApiResponse<MemberSettings>>(
        `/api/member-settings/${cafeId}`
      );

      if (response.data.data) {
        return response.data.data;
      }

      return {
        id: '',
        cafe_id: cafeId,
        earning_amount: 10000,
        earning_points: 1,
        redemption_points: 100,
        redemption_discount: 10,
      };
    } catch (error) {
      console.error('Error fetching member settings:', error);
      return {
        id: '',
        cafe_id: cafeId,
        earning_amount: 10000,
        earning_points: 1,
        redemption_points: 100,
        redemption_discount: 10,
      };
    }
  },

  updateSettings: async (payload: MemberSettingsPayload): Promise<MemberSettings> => {
    try {
      // Gunakan PUT dengan path parameter cafe_id sesuai FastAPI
      const response = await api.put<ApiResponse<MemberSettings>>(
        `/api/member-settings/${payload.cafe_id}`,
        payload
      );

      if (response.data.data) {
        return response.data.data;
      }

      throw new Error('Gagal menyimpan pengaturan member');
    } catch (error) {
      console.error('Error updating member settings:', error);

      // Jika server menolak PUT (405), coba fallback ke POST
      const status = (error as any)?.response?.status;
      if (status === 405) {
        try {
          const resp = await api.post<ApiResponse<MemberSettings>>(
            '/api/member-settings',
            payload
          );

          if (resp.data.data) {
            return resp.data.data;
          }

          throw new Error('Gagal menyimpan pengaturan member (fallback POST)');
        } catch (err2) {
          console.error('Fallback POST failed:', err2);
          throw err2;
        }
      }

      throw error;
    }
  },
};