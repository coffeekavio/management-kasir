'use client';

import Swal from 'sweetalert2';

/**
 * Modal untuk konfirmasi delete dengan styling menarik
 */
export const modalDeleteConfirm = async (
  itemName: string,
  itemDetails?: string
): Promise<boolean> => {
  const result = await Swal.fire({
    title: '🗑️ Hapus Data?',
    html: `
      <div style="text-align: left; margin-top: 20px;">
        <p><strong>Item:</strong> ${itemName}</p>
        ${itemDetails ? `<p><strong>Detail:</strong> ${itemDetails}</p>` : ''}
        <p style="color: #dc2626; margin-top: 15px; font-size: 0.9em;">
          ⚠️ Aksi ini tidak dapat dibatalkan setelah dikonfirmasi
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return result.isConfirmed;
};

/**
 * Modal untuk konfirmasi aksi umum
 */
export const modalConfirm = async (
  title: string,
  message: string,
  confirmText: string = 'Lanjutkan',
  cancelText: string = 'Batal',
  type: 'warning' | 'info' | 'question' = 'question'
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text: message,
    icon: type,
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return result.isConfirmed;
};

/**
 * Modal sukses dengan animasi
 */
export const modalSuccess = async (
  title: string = 'Berhasil!',
  message: string = '',
  autoClose: number = 1500
) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#2563eb',
    timer: autoClose,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
};

/**
 * Modal error dengan detail
 */
export const modalError = async (
  title: string = 'Terjadi Kesalahan!',
  message: string = '',
  errorCode?: string
) => {
  const html = `
    <div style="text-align: left;">
      <p>${message}</p>
      ${errorCode ? `<p style="color: #6b7280; font-size: 0.85em; margin-top: 10px;">Error Code: ${errorCode}</p>` : ''}
    </div>
  `;

  return Swal.fire({
    title,
    html,
    icon: 'error',
    confirmButtonColor: '#dc2626',
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
};

/**
 * Modal informasi
 */
export const modalInfo = async (
  title: string = 'Informasi',
  message: string = '',
  autoClose: number = 2000
) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'info',
    confirmButtonColor: '#2563eb',
    timer: autoClose,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
};

/**
 * Modal loading/processing
 */
export const modalLoading = (message: string = 'Sedang memproses...') => {
  Swal.fire({
    title: '⏳ Loading',
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
 * Modal dengan HTML content custom
 */
export const modalCustom = async (
  title: string,
  htmlContent: string,
  options?: {
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  }
) => {
  const result = await Swal.fire({
    title,
    html: htmlContent,
    icon: options?.icon || 'info',
    showCancelButton: options?.showCancel ?? false,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: options?.confirmText || 'OK',
    cancelButtonText: options?.cancelText || 'Batal',
    allowOutsideClick: false,
    allowEscapeKey: false,
  });

  return result.isConfirmed;
};

/**
 * Modal dengan input field
 */
export const modalPrompt = async (
  title: string,
  label: string,
  inputType: 'text' | 'email' | 'number' | 'password' = 'text',
  placeholder?: string
): Promise<string | null> => {
  const result = await Swal.fire({
    title,
    input: inputType,
    inputLabel: label,
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'OK',
    cancelButtonText: 'Batal',
    allowOutsideClick: false,
    allowEscapeKey: false,
    inputValidator: (value) => {
      if (!value) {
        return 'Field tidak boleh kosong!';
      }
    },
  });

  return result.isConfirmed ? result.value : null;
};

/**
 * Modal progress untuk multi-step
 */
export const modalProgress = async (
  currentStep: number,
  totalSteps: number,
  title: string,
  message: string
) => {
  const progressPercent = (currentStep / totalSteps) * 100;

  return Swal.fire({
    title,
    html: `
      <div style="margin: 20px 0;">
        <p>${message}</p>
        <div style="
          width: 100%;
          height: 10px;
          background-color: #e5e7eb;
          border-radius: 10px;
          margin-top: 15px;
          overflow: hidden;
        ">
          <div style="
            width: ${progressPercent}%;
            height: 100%;
            background-color: #2563eb;
            transition: width 0.3s ease;
          "></div>
        </div>
        <p style="margin-top: 10px; font-size: 0.9em; color: #6b7280;">
          Langkah ${currentStep} dari ${totalSteps}
        </p>
      </div>
    `,
    icon: 'info',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });
};

/**
 * Update modal yang sedang terbuka
 */
export const updateModal = (
  title?: string,
  text?: string,
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
) => {
  Swal.update({
    title,
    text,
    icon,
  });
};

/**
 * Close modal
 */
export const closeModal = () => {
  Swal.close();
};

/**
 * Transition loading ke success
 */
export const transitionToSuccess = async (
  message: string = 'Berhasil!',
  autoClose: number = 1500
) => {
  updateModal('Berhasil!', message, 'success');
  setTimeout(() => {
    closeModal();
  }, autoClose);
};

/**
 * Transition loading ke error
 */
export const transitionToError = (
  message: string = 'Terjadi kesalahan!',
  autoClose: number = 2000
) => {
  updateModal('Error!', message, 'error');
  setTimeout(() => {
    closeModal();
  }, autoClose);
};

/**
 * Toast notification (non-blocking, appears at top)
 */
export const toastSuccess = (message: string, title: string = 'Berhasil!') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: 'success',
    title,
    text: message,
  });
};

/**
 * Toast notification untuk error
 */
export const toastError = (message: string, title: string = 'Error!') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: 'error',
    title,
    text: message,
  });
};

/**
 * Toast notification untuk warning
 */
export const toastWarning = (message: string, title: string = 'Perhatian') => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: 'warning',
    title,
    text: message,
  });
};
