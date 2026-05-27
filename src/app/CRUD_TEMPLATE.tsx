'use client';

import { useState } from 'react';
import { useCrudAlert } from '@/hooks/useAlert';

/**
 * TEMPLATE: Standard CRUD Page with Global Alerts
 * Copy this template dan sesuaikan untuk halaman CRUD Anda
 */

interface Item {
  id: string;
  name: string;
  // Add other fields as needed
}

export default function CRUDTemplatePage() {
  const alert = useCrudAlert();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    // Add other fields as needed
  });

  // ==================== CREATE ====================
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert.error('Validasi', 'Nama tidak boleh kosong');
      return;
    }

    try {
      alert.loading('Sedang menyimpan data...');
      
      if (editingItem) {
        // UPDATE
        // await apiService.update(editingItem.id, formData);
        alert.successAfterLoading('Data Berhasil Diperbarui!');
      } else {
        // CREATE
        // await apiService.create(formData);
        alert.successAfterLoading('Data Berhasil Ditambahkan!');
      }
      
      setIsModalOpen(false);
      setFormData({ name: '' });
      // fetchItems();
    } catch (error: unknown) {
      let errorMessage = 'Terjadi kesalahan saat menyimpan data';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert.error('Gagal Menyimpan', errorMessage);
    }
  };

  // ==================== READ ====================
  const handleOpenEditModal = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      // Map other fields
    });
    setIsModalOpen(true);
  };

  // ==================== DELETE ====================
  const handleDelete = async (id: string, itemName: string) => {
    const confirmed = await alert.confirmDelete(
      itemName,
      'Aksi ini tidak dapat dibatalkan'
    );

    if (confirmed) {
      try {
        alert.loading('Sedang menghapus data...');
        // await apiService.delete(id);
        alert.successAfterLoading('Data Berhasil Dihapus!');
        setItems(items.filter(item => item.id !== id));
      } catch (error: unknown) {
        let errorMessage = 'Gagal menghapus data';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        alert.error('Gagal Menghapus', errorMessage);
      }
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Data Management</h1>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Tambah Data
        </button>
      </div>

      {/* Table / List View */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Table or List component here */}
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Tidak ada data</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nama</th>
                <th className="text-right p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{item.name}</td>
                  <td className="text-right p-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit Data' : 'Tambah Data Baru'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masukkan nama"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              {/* Add more fields as needed */}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * IMPLEMENTASI CHECKLIST:
 * 
 * ✅ Import useCrudAlert hook
 * ✅ Setup state management (items, formData, modals)
 * ✅ Create handleSubmit untuk CREATE & UPDATE
 * ✅ Create handleDelete dengan confirmation
 * ✅ Create handleOpenEditModal untuk READ
 * ✅ Replace hardcoded alert() dengan alert functions
 * ✅ Wrap API calls dengan alert.loading() & alert.successAfterLoading()
 * ✅ Add error handling dengan alert.error()
 * ✅ Test semua flows: Create, Read, Update, Delete
 */
