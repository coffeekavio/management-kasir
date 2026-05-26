import { api } from './api';

export interface Member {
  id: string;
  cafe_id: string;
  name: string;
  phone?: string;
  points: number;
  created_at?: string;
}

export interface MemberCreatePayload {
  cafe_id: string;
  name: string;
  phone?: string;
  points?: number;
}

export interface MemberUpdatePayload {
  name?: string;
  phone?: string;
  points?: number;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  detail?: string;
  metadata?: Record<string, any>;
}

export const memberService = {
  // Fetch semua member berdasarkan cafe_id
  getMembers: async (cafeId: string): Promise<Member[]> => {
    try {
      const response = await api.get<ApiResponse<Member[]>>(
        `/api/members/?cafe_id=${cafeId}`
      );

      if (response.data.data) {
        return response.data.data;
      }

      throw new Error('Gagal memuat data member');
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  },

  // Fetch detail member berdasarkan member_id
  getMemberDetail: async (memberId: string): Promise<Member> => {
    try {
      const response = await api.get<ApiResponse<Member>>(
        `/api/members/${memberId}`
      );

      if (response.data.data) {
        return response.data.data;
      }

      throw new Error('Member tidak ditemukan');
    } catch (error) {
      console.error('Error fetching member detail:', error);
      throw error;
    }
  },

  // Tambah member baru
  createMember: async (payload: MemberCreatePayload): Promise<Member> => {
    try {
      console.log('Creating member with payload:', payload);

      const response = await api.post<ApiResponse<Member>>(
        '/api/create-members',
        {
          cafe_id: payload.cafe_id,
          name: payload.name,
          phone: payload.phone || null,
          points: payload.points || 0,
        }
      );

      console.log('Create member response:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      if (response.status === 201 || response.status === 200) {
        if (response.data.data) {
          return response.data.data;
        }
      }

      throw new Error(response.data.detail || 'Gagal menambah member');
    } catch (error) {
      console.error('Error creating member:', error);

      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response !== null) {
          const resp = error.response as any;
          console.error('Response error details:', resp.data);
        }
      }

      throw error;
    }
  },

  // Update data member
  updateMember: async (
    memberId: string,
    payload: MemberUpdatePayload
  ): Promise<Member> => {
    try {
      console.log('Updating member:', { memberId, ...payload });

      const response = await api.put<ApiResponse<Member>>(
        `/api/update-members/${memberId}`,
        payload
      );

      console.log('Update member response:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      if (response.status === 200) {
        return response.data.data;
      }

      throw new Error(response.data.detail || 'Gagal memperbarui member');
    } catch (error) {
      console.error('Error updating member:', error);

      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response !== null) {
          const resp = error.response as any;
          console.error('Response error details:', resp.data);
        }
      }

      throw error;
    }
  },

  // Update poin member
  updateMemberPoints: async (
    memberId: string,
    pointsChange: number
  ): Promise<Member> => {
    try {
      console.log('Updating member points:', { memberId, pointsChange });

      const response = await api.put<ApiResponse<Member>>(
        `/api/members/${memberId}/points?points_change=${pointsChange}`
      );

      console.log('Update points response:', response.data);

      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }

      if (response.status === 200) {
        return response.data.data;
      }

      throw new Error(response.data.detail || 'Gagal memperbarui poin member');
    } catch (error) {
      console.error('Error updating member points:', error);
      throw error;
    }
  },

  // Hapus member
  deleteMember: async (memberId: string): Promise<void> => {
    try {
      console.log('Deleting member:', memberId);

      const response = await api.delete<ApiResponse<unknown>>(
        `/api/delete-members/${memberId}`
      );

      console.log('Delete member response:', response.data);

      if (response.data.status !== 'success' && response.status !== 200) {
        throw new Error(response.data.detail || 'Gagal menghapus member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  },
};
