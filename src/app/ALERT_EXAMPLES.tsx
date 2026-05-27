/**
 * 🎯 GLOBAL ALERT SYSTEM - CONTOH PENGGUNAAN
 * File ini menunjukkan berbagai contoh implementasi alert system di berbagai skenario
 */

// ============================================
// CONTOH 1: Basic CRUD dengan useCrudAlert
// ============================================

import { useCrudAlert } from '@/hooks/useAlert';

export function BasicCRUDExample() {
  const alert = useCrudAlert();

  // ✅ CREATE
  const handleCreate = async (data: any) => {
    try {
      alert.loading('Sedang menambahkan...');
      const response = await api.create(data);
      alert.successAfterLoading('Data berhasil ditambahkan!');
      return response;
    } catch (error) {
      alert.errorAfterLoading('Gagal menambahkan data');
      throw error;
    }
  };

  // ✅ READ - dengan konfirmasi
  const handleRead = async (id: string) => {
    const confirmed = await alert.confirmDelete('item');

    if (confirmed) {
      alert.loading('Memuat data...');
      const data = await api.read(id);
      alert.close();
      return data;
    }
  };

  // ✅ UPDATE
  const handleUpdate = async (id: string, data: any) => {
    try {
      alert.loading('Sedang mengubah...');
      const response = await api.update(id, data);
      alert.successAfterLoading('Data berhasil diperbarui!');
      return response;
    } catch (error) {
      alert.errorAfterLoading('Gagal memperbarui data');
      throw error;
    }
  };

  // ✅ DELETE - dengan konfirmasi spesifik
  const handleDelete = async (id: string, itemName: string) => {
    const confirmed = await alert.confirmDelete(itemName);

    if (confirmed) {
      try {
        alert.loading('Sedang menghapus...');
        await api.delete(id);
        alert.successAfterLoading('Data berhasil dihapus!');
      } catch (error) {
        alert.errorAfterLoading('Gagal menghapus data');
        throw error;
      }
    }
  };

  return null;
}

// ============================================
// CONTOH 2: Advanced Alert dengan useAlert
// ============================================

import { useAlert } from '@/hooks/useAlert';

export function AdvancedAlertExample() {
  const alert = useAlert();

  // ✅ Custom confirmation dengan message panjang
  const handleComplexConfirm = async () => {
    const result = await alert.confirm(
      'Konfirmasi Operasi Kompleks',
      'Operasi ini akan:\n1. Menghapus 50 records\n2. Update cache\n3. Mengirim notifikasi\n\nLanjutkan?',
      'Ya, Lanjutkan',
      'Batal'
    );

    if (result) {
      alert.loading('Processing kompleks operasi...');
      // ... do something
      alert.update('Sukses!', 'Semua langkah berhasil dieksekusi', 'success');
    }
  };

  // ✅ Prompt dengan validasi
  const handlePromptWithValidation = async () => {
    const itemName = await alert.prompt(
      'Masukkan Nama Item',
      'Nama Item',
      'text'
    );

    if (itemName && itemName.length >= 3) {
      alert.success('Valid!', `Nama "${itemName}" valid`);
    } else if (itemName) {
      alert.error('Invalid!', 'Nama minimal 3 karakter');
    }
  };

  // ✅ Custom HTML
  const handleCustomAlert = async () => {
    await alert.custom(
      'Detail Operasi',
      '<div style="text-align: left; line-height: 2;">' +
      '<strong>Status:</strong> ✅ Berhasil<br/>' +
      '<strong>Records:</strong> 125 items<br/>' +
      '<strong>Duration:</strong> 2.3s<br/>' +
      '<strong>Next:</strong> Check your email for report' +
      '</div>',
      'success'
    );
  };

  return null;
}

// ============================================
// CONTOH 3: Modal Components (Advanced UI)
// ============================================

import {
  modalDeleteConfirm,
  modalSuccess,
  modalError,
  modalLoading,
  toastSuccess,
  toastError,
  updateModal,
} from '@/components/Modals';

export async function ModalComponentsExample() {
  // ✅ Delete dengan detail
  const handleDeleteWithDetail = async () => {
    const confirmed = await modalDeleteConfirm(
      'Premium Package',
      'Harga: Rp 500,000 | Status: Active'
    );

    if (confirmed) {
      modalLoading('Menghapus package...');
      // ... do something
      updateModal('Berhasil!', 'Package berhasil dihapus', 'success');
    }
  };

  // ✅ Non-blocking toast
  const handleWithToast = async () => {
    try {
      await apiCall();
      toastSuccess('Operasi berhasil!', 'Data tersimpan');
    } catch (error) {
      toastError('Gagal menyimpan', 'Periksa koneksi internet');
    }
  };

  // ✅ Loading dengan transition
  const handleLoadingTransition = async () => {
    modalLoading('Uploading file...');

    try {
      const result = await uploadFile();
      updateModal('Berhasil!', `File ${result.name} berhasil diupload`, 'success');
    } catch (error) {
      updateModal('Error!', 'Gagal mengupload file', 'error');
    }
  };
}

// ============================================
// CONTOH 4: Batch Operations
// ============================================

export async function BatchOperationsExample() {
  const crudAlert = useCrudAlert();

  const handleBatchDelete = async (selectedIds: string[]) => {
    const confirmed = await crudAlert.confirm(
      'Hapus Multiple Item?',
      `Anda akan menghapus ${selectedIds.length} item. Lanjutkan?`,
      'Ya, Hapus Semua',
      'Batal'
    );

    if (confirmed) {
      crudAlert.loading(`Menghapus ${selectedIds.length} item...`);
      
      try {
        for (let i = 0; i < selectedIds.length; i++) {
          await api.delete(selectedIds[i]);
          // Optional: update progress
          crudAlert.update(
            `Menghapus ${i + 1}/${selectedIds.length}...`,
            '',
            'info'
          );
        }
        crudAlert.successAfterLoading(`${selectedIds.length} item berhasil dihapus!`);
      } catch (error) {
        crudAlert.errorAfterLoading('Gagal menghapus beberapa item');
      }
    }
  };

  return null;
}

// ============================================
// CONTOH 5: Form Validation dengan Alert
// ============================================

export function FormValidationExample() {
  const alert = useAlert();

  const handleFormSubmit = async (formData: any) => {
    // Validation checks
    if (!formData.name?.trim()) {
      alert.error('Validasi', 'Nama tidak boleh kosong');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      alert.error('Validasi', 'Format email tidak valid');
      return;
    }

    if (formData.amount <= 0) {
      alert.error('Validasi', 'Jumlah harus lebih dari 0');
      return;
    }

    // If all validation pass
    try {
      alert.loading('Sedang memproses...');
      await submitForm(formData);
      alert.success('Sukses!', 'Form berhasil disubmit');
    } catch (error) {
      alert.error('Error', 'Gagal memproses form');
    }
  };

  return null;
}

// ============================================
// CONTOH 6: Multi-Step Operations
// ============================================

import { modalProgress } from '@/components/Modals';

export async function MultiStepExample() {
  const alert = useCrudAlert();
  const totalSteps = 3;

  const handleMultiStep = async () => {
    try {
      // Step 1: Validate
      await modalProgress(1, totalSteps, 'Processing', 'Validating data...');
      await validateData();
      await new Promise(r => setTimeout(r, 1000));

      // Step 2: Process
      await modalProgress(2, totalSteps, 'Processing', 'Processing data...');
      await processData();
      await new Promise(r => setTimeout(r, 1000));

      // Step 3: Save
      await modalProgress(3, totalSteps, 'Processing', 'Saving data...');
      await saveData();

      alert.successAfterLoading('Semua langkah berhasil!');
    } catch (error) {
      alert.errorAfterLoading('Terjadi kesalahan di tahap processing');
    }
  };

  return null;
}

// ============================================
// CONTOH 7: Different Error Scenarios
// ============================================

export async function ErrorHandlingExample() {
  const crudAlert = useCrudAlert();

  const handleDifferentErrors = async () => {
    try {
      await riskyOperation();
    } catch (error: any) {
      // Network error
      if (error.code === 'NETWORK_ERROR') {
        crudAlert.error(
          'Koneksi Error',
          'Periksa koneksi internet Anda'
        );
      }
      // Validation error
      else if (error.code === 'VALIDATION_ERROR') {
        crudAlert.error(
          'Validasi Gagal',
          error.details?.join(', ')
        );
      }
      // Authentication error
      else if (error.code === 'AUTH_ERROR') {
        crudAlert.error(
          'Autentikasi Gagal',
          'Silakan login kembali'
        );
      }
      // Server error
      else if (error.code >= 500) {
        crudAlert.error(
          'Server Error',
          'Server sedang bermasalah, coba lagi nanti'
        );
      }
      // Generic error
      else {
        crudAlert.error(
          'Terjadi Kesalahan',
          error.message || 'Operasi gagal'
        );
      }
    }
  };

  return null;
}

// ============================================
// CONTOH 8: Success Path dengan Callback
// ============================================

export function SuccessCallbackExample() {
  const alert = useCrudAlert();

  const handleWithCallback = async (onSuccess?: () => void) => {
    try {
      alert.loading('Sedang memproses...');
      const result = await api.operation();
      alert.successAfterLoading('Operasi berhasil!');
      
      // Execute callback after success
      if (onSuccess) {
        onSuccess();
      }
      
      return result;
    } catch (error) {
      alert.errorAfterLoading('Operasi gagal');
      throw error;
    }
  };

  return null;
}

// ============================================
// CONTOH 9: Conditional Alerts
// ============================================

export function ConditionalAlertsExample() {
  const crudAlert = useCrudAlert();

  const handleConditionalAlert = async (itemCount: number) => {
    if (itemCount === 0) {
      crudAlert.info('Info', 'Tidak ada item untuk diproses');
      return;
    }

    if (itemCount === 1) {
      crudAlert.info('Info', 'Hanya 1 item yang akan diproses');
    } else if (itemCount > 100) {
      const confirmed = await crudAlert.confirm(
        'Perhatian!',
        `Anda akan memproses ${itemCount} item. Ini mungkin memakan waktu. Lanjutkan?`,
        'Ya, Lanjutkan',
        'Batal'
      );

      if (!confirmed) return;
    }

    crudAlert.loading('Memproses...');
    try {
      await processItems(itemCount);
      crudAlert.successAfterLoading(`${itemCount} item berhasil diproses!`);
    } catch (error) {
      crudAlert.errorAfterLoading('Gagal memproses items');
    }
  };

  return null;
}

// ============================================
// CONTOH 10: Real World - User Registration Flow
// ============================================

export function RegistrationFlowExample() {
  const alert = useAlert();

  const handleRegistration = async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    try {
      // Step 1: Validate input
      if (!userData.name?.trim()) {
        alert.error('Validasi', 'Nama tidak boleh kosong');
        return;
      }

      if (!isValidEmail(userData.email)) {
        alert.error('Validasi', 'Email tidak valid');
        return;
      }

      if (userData.password.length < 6) {
        alert.error('Validasi', 'Password minimal 6 karakter');
        return;
      }

      // Step 2: Check if email exists
      alert.loading('Memeriksa email...');
      const emailExists = await checkEmailExists(userData.email);

      if (emailExists) {
        alert.error('Email Terdaftar', 'Email sudah terdaftar di sistem');
        return;
      }

      // Step 3: Register user
      alert.update('Mendaftarkan user...', '', 'info');
      const response = await registerUser(userData);

      // Step 4: Success
      alert.success(
        'Registrasi Berhasil!',
        'Silakan check email untuk verifikasi akun Anda'
      );

      return response;
    } catch (error: any) {
      alert.error(
        'Registrasi Gagal',
        error.message || 'Terjadi kesalahan'
      );
    }
  };

  return null;
}

// Utility functions (implement sesuai kebutuhan)
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function validateData(): Promise<void> {
  // Implementation
  return new Promise(r => setTimeout(r, 500));
}

async function processData(): Promise<void> {
  // Implementation
  return new Promise(r => setTimeout(r, 500));
}

async function saveData(): Promise<void> {
  // Implementation
  return new Promise(r => setTimeout(r, 500));
}

async function checkEmailExists(email: string): Promise<boolean> {
  // API call
  return false;
}

async function registerUser(data: any): Promise<any> {
  // API call
  return {};
}

async function riskyOperation(): Promise<void> {
  // Implementation
}

async function processItems(count: number): Promise<void> {
  // Implementation
}

async function submitForm(data: any): Promise<void> {
  // Implementation
}

async function uploadFile(): Promise<{ name: string }> {
  // Implementation
  return { name: 'file.pdf' };
}

async function apiCall(): Promise<void> {
  // Implementation
}

const api = {
  create: async (data: any) => ({}),
  read: async (id: string) => ({}),
  update: async (id: string, data: any) => ({}),
  delete: async (id: string) => ({}),
  operation: async () => ({}),
};
