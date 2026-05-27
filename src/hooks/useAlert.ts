'use client';

import {
  alertSuccess,
  alertError,
  alertConfirm,
  alertConfirmDelete,
  alertLoading,
  closeAlert,
  updateAlert,
  alertCustom,
  alertPrompt,
  alertInfo,
} from '@/lib/alertUtils';

/**
 * Custom hook untuk menggunakan alerts di komponen
 */
export const useAlert = () => {
  return {
    success: alertSuccess,
    error: alertError,
    confirm: alertConfirm,
    confirmDelete: alertConfirmDelete,
    loading: alertLoading,
    close: closeAlert,
    update: updateAlert,
    custom: alertCustom,
    prompt: alertPrompt,
    info: alertInfo,
  };
};

/**
 * Higher level alert functions untuk CRUD operations
 */
export const useCrudAlert = () => {
  const alert = useAlert();

  return {
    /**
     * Success - Data berhasil ditambah
     */
    successAdd: (itemName: string = 'Data') => {
      return alert.success(
        'Berhasil Ditambahkan!',
        `${itemName} berhasil ditambahkan ke dalam sistem`,
        'success'
      );
    },

    /**
     * Success - Data berhasil diubah
     */
    successUpdate: (itemName: string = 'Data') => {
      return alert.success(
        'Berhasil Diubah!',
        `${itemName} berhasil diperbarui`,
        'success'
      );
    },

    /**
     * Success - Data berhasil dihapus
     */
    successDelete: (itemName: string = 'Data') => {
      return alert.success(
        'Berhasil Dihapus!',
        `${itemName} berhasil dihapus dari sistem`,
        'success'
      );
    },

    /**
     * Error - Gagal menambah data
     */
    errorAdd: (message: string = 'Gagal menambahkan data') => {
      return alert.error('Gagal Menambah Data!', message);
    },

    /**
     * Error - Gagal mengubah data
     */
    errorUpdate: (message: string = 'Gagal mengubah data') => {
      return alert.error('Gagal Mengubah Data!', message);
    },

    /**
     * Error - Gagal menghapus data
     */
    errorDelete: (message: string = 'Gagal menghapus data') => {
      return alert.error('Gagal Menghapus Data!', message);
    },

    /**
     * Confirm - Konfirmasi tambah data
     */
    confirmAdd: (itemName: string = 'data') => {
      return alert.confirm(
        'Tambah Data Baru?',
        `Anda yakin ingin menambahkan ${itemName} baru ini?`,
        'Ya, Tambahkan',
        'Batal'
      );
    },

    /**
     * Confirm - Konfirmasi ubah data
     */
    confirmUpdate: (itemName: string = 'data') => {
      return alert.confirm(
        'Ubah Data?',
        `Anda yakin ingin mengubah ${itemName} ini?`,
        'Ya, Ubah',
        'Batal'
      );
    },

    /**
     * Confirm - Konfirmasi hapus data dengan pesan tambahan
     */
    confirmDelete: (itemName: string = 'data', additionalMessage: string = '') => {
      return alert.confirmDelete(itemName, additionalMessage);
    },

    /**
     * Generic error alert
     */
    error: (title: string, message: string) => {
      return alert.error(title, message);
    },

    /**
     * Generic info alert
     */
    info: (title: string, message: string) => {
      return alert.info(title, message);
    },

    /**
     * Generic confirm alert
     */
    confirm: (title: string, message: string, confirmText: string = 'Ya', cancelText: string = 'Batal') => {
      return alert.confirm(title, message, confirmText, cancelText);
    },

    /**
     * Update alert
     */
    update: (title: string, message: string, icon: 'success' | 'info' | 'warning' | 'error' | 'question') => {
      return alert.update(title, message, icon);
    },

    /**
     * Loading state
     */
    loading: (message: string = 'Sedang memproses...') => {
      return alert.loading(message);
    },

    /**
     * Update loading to success
     */
    successAfterLoading: (message: string = 'Berhasil!') => {
      return alert.update(message, '', 'success');
    },

    /**
     * Update loading to error
     */
    errorAfterLoading: (message: string = 'Terjadi kesalahan!') => {
      return alert.update(message, '', 'error');
    },

    /**
     * Close alert
     */
    close: alert.close,
  };
};
