import Swal from 'sweetalert2';

// Configuration untuk tampilan alert
const alertConfig = {
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#ef4444',
  allowOutsideClick: false,
  allowEscapeKey: false,
  showConfirmButton: true,
};

/**
 * Alert Sukses - Untuk notifikasi operasi berhasil
 */
export const alertSuccess = async (
  title: string = 'Berhasil!',
  message: string = 'Operasi berhasil dilakukan',
  icon: 'success' | 'info' | 'warning' | 'error' | 'question' = 'success'
) => {
  return Swal.fire({
    ...alertConfig,
    icon,
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
};

/**
 * Alert Error - Untuk notifikasi error
 */
export const alertError = async (
  title: string = 'Error!',
  message: string = 'Terjadi kesalahan'
) => {
  return Swal.fire({
    ...alertConfig,
    icon: 'error',
    title,
    text: message,
  });
};

/**
 * Alert Konfirmasi - Untuk ask user confirmation
 */
export const alertConfirm = async (
  title: string = 'Apakah anda yakin?',
  message: string = 'Aksi ini tidak bisa dibatalkan!',
  confirmText: string = 'Ya, Lanjutkan',
  cancelText: string = 'Batal'
): Promise<boolean> => {
  const result = await Swal.fire({
    ...alertConfig,
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });

  return result.isConfirmed;
};

/**
 * Alert Konfirmasi Hapus - Khusus untuk delete confirmation
 */
export const alertConfirmDelete = async (
  itemName: string = 'data ini',
  additionalMessage: string = ''
): Promise<boolean> => {
  const result = await Swal.fire({
    ...alertConfig,
    icon: 'warning',
    title: 'Hapus Data?',
    html: `
      <p>Anda yakin ingin menghapus <strong>${itemName}</strong>?</p>
      ${additionalMessage ? `<p style="font-size: 0.9em; color: #666; margin-top: 10px;">${additionalMessage}</p>` : ''}
    `,
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
  });

  return result.isConfirmed;
};

/**
 * Alert Loading/Processing
 */
export const alertLoading = (message: string = 'Sedang memproses...') => {
  Swal.fire({
    title: 'Loading',
    text: message,
    icon: 'info',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * Close current alert
 */
export const closeAlert = () => {
  Swal.close();
};

/**
 * Update alert (useful for loading to success transition)
 */
export const updateAlert = (
  title: string,
  message: string,
  icon: 'success' | 'info' | 'warning' | 'error' | 'question'
) => {
  Swal.update({
    title,
    text: message,
    icon,
    showConfirmButton: false,
  });

  // Auto close after 2 seconds for success alerts
  if (icon === 'success') {
    setTimeout(() => {
      Swal.close();
    }, 2000);
  }
};

/**
 * Custom Alert dengan HTML content
 */
export const alertCustom = async (
  title: string,
  htmlContent: string,
  icon?: 'success' | 'info' | 'warning' | 'error' | 'question'
) => {
  return Swal.fire({
    ...alertConfig,
    title,
    html: htmlContent,
    icon,
  });
};

/**
 * Alert dengan input (untuk prompt)
 */
export const alertPrompt = async (
  title: string,
  inputLabel: string,
  inputType: string = 'text'
): Promise<string | null> => {
  const result = await Swal.fire({
    ...alertConfig,
    title,
    input: inputType as any,
    inputLabel,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
  });

  return result.isConfirmed ? result.value : null;
};

/**
 * Alert Info
 */
export const alertInfo = async (
  title: string = 'Informasi',
  message: string = ''
) => {
  return Swal.fire({
    ...alertConfig,
    icon: 'info',
    title,
    text: message,
    timer: 2500,
    showConfirmButton: false,
  });
};
