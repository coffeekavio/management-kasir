# 📋 Global Modal & Alert System Documentation

Sistem global untuk menangani semua popup, modal, dan notifikasi di aplikasi menggunakan **SweetAlert2**.

## 📦 Packages Terinstall
- `sweetalert2` - Library untuk beautiful modals dan alerts

---

## 🎯 Implementasi di Aplikasi

### **1. Menggunakan Hook `useCrudAlert()` (Recommended untuk CRUD)**

Hook ini sudah dikonfigurasi khusus untuk operasi CRUD dengan message templates siap pakai.

#### **Impor:**
```typescript
import { useCrudAlert } from '@/hooks/useAlert';
```

#### **Penggunaan di Component:**
```typescript
export default function MyComponent() {
  const alert = useCrudAlert();

  const handleAdd = async () => {
    // Tampilkan loading
    alert.loading('Sedang menambahkan data...');
    
    try {
      // API call
      await apiService.create(data);
      
      // Success alert
      alert.successAfterLoading('Data Berhasil Ditambahkan!');
      // atau
      alert.successAdd('Bahan Baku');
    } catch (error) {
      alert.errorAfterLoading('Gagal menambahkan data');
      // atau
      alert.errorAdd(error.message);
    }
  };

  return <button onClick={handleAdd}>Tambah</button>;
}
```

#### **Available Methods:**
```typescript
// Success Alerts
alert.successAdd(itemName)        // Berhasil ditambahkan
alert.successUpdate(itemName)     // Berhasil diubah
alert.successDelete(itemName)     // Berhasil dihapus

// Error Alerts
alert.errorAdd(message)           // Error menambah
alert.errorUpdate(message)        // Error mengubah
alert.errorDelete(message)        // Error menghapus

// Confirmation Dialogs
alert.confirmAdd(itemName)        // Konfirmasi tambah
alert.confirmUpdate(itemName)     // Konfirmasi ubah
alert.confirmDelete(itemName, additionalMessage) // Konfirmasi hapus

// Loading & Transitions
alert.loading(message)            // Show loading
alert.successAfterLoading(msg)    // Loading -> Success
alert.errorAfterLoading(msg)      // Loading -> Error
alert.close()                     // Close alert
```

---

### **2. Menggunakan Hook `useAlert()` (Advanced)**

Hook untuk akses langsung ke semua fungsi alert individual.

#### **Impor:**
```typescript
import { useAlert } from '@/hooks/useAlert';
```

#### **Penggunaan:**
```typescript
export default function MyComponent() {
  const alert = useAlert();

  const handleDelete = async (id) => {
    const confirmed = await alert.confirm(
      'Hapus Data?',
      'Aksi ini tidak dapat dibatalkan!',
      'Ya, Hapus',
      'Batal'
    );

    if (confirmed) {
      await deleteAPI(id);
      alert.success('Sukses!', 'Data berhasil dihapus');
    }
  };

  return <button onClick={handleDelete}>Hapus</button>;
}
```

#### **Available Methods:**
```typescript
alert.success(title, message, icon)        // Alert sukses
alert.error(title, message)                // Alert error
alert.info(title, message)                 // Alert info
alert.confirm(title, text, confirmBtn, cancelBtn) // Konfirmasi
alert.confirmDelete(itemName, additionalMsg)      // Khusus delete
alert.loading(message)                    // Show loading
alert.close()                              // Close alert
alert.update(title, message, icon)         // Update alert
alert.custom(title, htmlContent, icon)     // Custom HTML
alert.prompt(title, label, type)           // Input field
```

---

### **3. Menggunakan Module Components/Modals (Advanced UI)**

Module dengan styling lebih advanced dan fitur lengkap.

#### **Impor:**
```typescript
import {
  modalSuccess,
  modalError,
  modalDeleteConfirm,
  modalConfirm,
  modalLoading,
  toastSuccess,
  toastError,
  closeModal,
  updateModal,
} from '@/components/Modals';
```

#### **Contoh Penggunaan:**

**Delete Confirmation:**
```typescript
const handleDelete = async (id, itemName) => {
  const confirmed = await modalDeleteConfirm(
    itemName,
    'Detail: Ini adalah item yang akan dihapus'
  );

  if (confirmed) {
    modalLoading('Sedang menghapus...');
    try {
      await deleteAPI(id);
      updateModal('Berhasil!', 'Data berhasil dihapus', 'success');
    } catch (error) {
      updateModal('Error!', error.message, 'error');
    }
  }
};
```

**Toast Notification:**
```typescript
// Non-blocking notifications (appears at top-right)
toastSuccess('Data berhasil disimpan!', 'Sukses');
toastError('Gagal menghubungi server', 'Error');
toastWarning('Pastikan semua field terisi', 'Perhatian');
```

**Custom Modal:**
```typescript
const confirmed = await modalCustom(
  'Konfirmasi',
  '<p>Anda yakin ingin melanjutkan?</p>',
  {
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    showCancel: true,
    icon: 'warning',
  }
);
```

---

## 📝 Contoh Real - Ingredients Page

Lihat implementasi lengkap di: `src/app/(dashboard)/dashboard/ingredients/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useCrudAlert } from '@/hooks/useAlert';

export default function IngredientsPage() {
  const alert = useCrudAlert();
  const [ingredients, setIngredients] = useState([]);

  const handleAdd = async (formData) => {
    try {
      alert.loading('Menyimpan bahan baku...');
      const response = await ingredientService.create(formData);
      alert.successAfterLoading('Bahan Baku Berhasil Ditambahkan!');
      setIngredients([...ingredients, response]);
    } catch (error) {
      alert.errorAfterLoading(error.message);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await alert.confirmDelete(name);
    
    if (confirmed) {
      try {
        alert.loading('Menghapus...');
        await ingredientService.delete(id);
        alert.successAfterLoading('Berhasil Dihapus!');
        setIngredients(ingredients.filter(item => item.id !== id));
      } catch (error) {
        alert.errorDelete(error.message);
      }
    }
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

---

## 🎨 Styling & Theme

Semua alerts sudah dikonfigurasi dengan:
- ✅ Warna brand (Blue #2563eb)
- ✅ Icon yang sesuai
- ✅ Animasi smooth
- ✅ Auto-close untuk success (1.5-2 detik)
- ✅ Responsive mobile

### **Customize Warna:**

Edit di `src/lib/alertUtils.ts` - section `alertConfig`:

```typescript
const alertConfig = {
  confirmButtonColor: '#2563eb',  // Warna tombol confirm
  cancelButtonColor: '#ef4444',   // Warna tombol cancel
  allowOutsideClick: false,
  allowEscapeKey: false,
};
```

---

## 🚀 Best Practices

### ✅ DO:
```typescript
// 1. Gunakan useCrudAlert untuk CRUD operations
const alert = useCrudAlert();
alert.successAdd('Bahan Baku');

// 2. Selalu wrap API calls dengan loading
alert.loading('Processing...');
try {
  await apiCall();
  alert.successAfterLoading('Success!');
} catch (error) {
  alert.errorAfterLoading(error.message);
}

// 3. Konfirmasi sebelum operasi destruktif
const confirmed = await alert.confirmDelete('item');
if (confirmed) {
  // delete operation
}
```

### ❌ DON'T:
```typescript
// ❌ Jangan gunakan alert() bawaan browser
alert('Message');  // JANGAN PAKAI

// ❌ Jangan gunakan confirm() bawaan browser
if (confirm('Are you sure?')) { }  // JANGAN PAKAI

// ❌ Jangan nest multiple alerts
alert.loading();
// ... tanpa close, langsung:
alert.success(); // JANGAN
```

---

## 🔄 Flow Diagram

```
┌─────────────┐
│   Mulai     │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  alert.loading()     │
│  (Tampilkan loading) │
└──────┬───────────────┘
       │
       ▼
    ┌─────────────────────────┐
    │   API Call/Operation    │
    └────┬──────────┬─────────┘
         │          │
      ✅ Sukses  ❌ Error
         │          │
         ▼          ▼
    ┌─────────┐  ┌─────────┐
    │ Success │  │ Error   │
    │ Modal   │  │ Modal   │
    └─────────┘  └─────────┘
```

---

## 📚 File-file Terkait

- `src/lib/alertUtils.ts` - Core alert functions
- `src/hooks/useAlert.ts` - React hooks untuk alerts
- `src/components/Modals.tsx` - Advanced modal components
- `src/app/(dashboard)/dashboard/ingredients/page.tsx` - Contoh implementasi

---

## ✨ Tips & Tricks

**1. Combine dengan Toast untuk notifications non-blocking:**
```typescript
import { toastSuccess, modalLoading } from '@/components/Modals';

await modalLoading('Processing...');
// do something
toastSuccess('Operasi berhasil!'); // tidak blocking
```

**2. Update modal saat loading transition:**
```typescript
alert.loading('Uploading...');
// ... after upload
alert.update('Upload Complete!', 'File uploaded successfully', 'success');
// Auto close after 2s
```

**3. Custom HTML di alert:**
```typescript
const alert = useAlert();
await alert.custom(
  'Informasi Penting',
  '<strong>Point penting:</strong><ul><li>Item 1</li><li>Item 2</li></ul>',
  'info'
);
```

---

**Happy coding! 🚀**
