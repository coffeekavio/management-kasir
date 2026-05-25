'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, RefreshCw } from 'lucide-react';
import { menuService, type Category } from '@/services/menuService';
import { useAuthStore } from '@/lib/store';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Get activeCafeId dari Zustand store
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  // State Form Input
  const [formData, setFormData] = useState({
    name: '',
  });

  // Fungsi fetch data kategori
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!activeCafeId) {
        setIsLoading(false);
        return;
      }

      const data = await menuService.getCategories(activeCafeId);
      setCategories(data);
    } catch (error: unknown) {
      console.error('Gagal memuat data kategori:', error);
      alert('Gagal memuat data kategori');
    } finally {
      setIsLoading(false);
    }
  }, [activeCafeId]);

  // Auto-refresh ketika activeCafeId berubah
  useEffect(() => {
    if (activeCafeId) {
      fetchCategories();
    }
  }, [activeCafeId, fetchCategories]);

  // Membuka Modal Tambah Baru
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  // Membuka Modal Edit
  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
    });
    setIsModalOpen(true);
  };

  // Menangani Simpan Data (Tambah & Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!activeCafeId) {
      alert('Error: Silakan pilih cafe terlebih dahulu dari dropdown di navbar');
      return;
    }

    try {
      if (editingCategory) {
        // EDIT: Update kategori - pass cafeId sebagai parameter
        await menuService.updateCategory(editingCategory.id, formData.name, activeCafeId);
        alert('Kategori berhasil diperbarui!');
      } else {
        // TAMBAH: Tambah kategori baru
        await menuService.createCategory(activeCafeId, formData.name);
        alert('Kategori berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      setFormData({ name: '' });
      fetchCategories(); // Refresh data
    } catch (error: unknown) {
      console.error('Gagal menyimpan kategori:', error);

      let errorMessage = 'Gagal menyimpan kategori.';

      if (error instanceof Error) {
        console.log('Error type:', error.name);
        console.log('Error message:', error.message);
        console.log('Error properties:', error);
        
        // Try to extract error detail from response
        if (
          'response' in error &&
          typeof error.response === 'object' &&
          error.response !== null
        ) {
          const response = error.response as any;
          if (response.data?.detail) {
            errorMessage = response.data.detail;
          } else if (response.data?.message) {
            errorMessage = response.data.message;
          } else if (response.statusText) {
            errorMessage = response.statusText;
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'detail' in error &&
        typeof error.detail === 'string'
      ) {
        errorMessage = error.detail;
      } else {
        console.log('Unknown error type:', typeof error, error);
        errorMessage = JSON.stringify(error);
      }

      alert(`Error: ${errorMessage}`);
    }
  };

  // Menangani Hapus Data
  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini? Kategori yang terikat menu tidak bisa dihapus.')) {
      try {
        // Pass cafeId sebagai parameter
        await menuService.deleteCategory(id, activeCafeId);
        setCategories(categories.filter((c) => c.id !== id));
        alert('Kategori berhasil dihapus!');
      } catch (error) {
        console.error('Gagal menghapus kategori:', error);

        let errorMessage = 'Gagal menghapus kategori dari server.';

        if (error instanceof Error) {
          console.log('Delete error type:', error.name);
          console.log('Delete error message:', error.message);
          console.log('Delete error properties:', error);
          
          // Try to extract error detail from response
          if (
            'response' in error &&
            typeof error.response === 'object' &&
            error.response !== null
          ) {
            const response = error.response as any;
            if (response.data?.detail) {
              errorMessage = response.data.detail;
            } else if (response.data?.message) {
              errorMessage = response.data.message;
            } else if (response.statusText) {
              errorMessage = response.statusText;
            } else {
              errorMessage = error.message;
            }
          } else {
            errorMessage = error.message;
          }
        } else {
          console.log('Unknown delete error type:', typeof error, error);
          errorMessage = JSON.stringify(error);
        }

        alert(`Error: ${errorMessage}`);
      }
    }
  };

  // Pencarian realtime
  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Kategori Menu</h1>
          <p className="text-gray-600 mt-1">Kelompokkan menu produk jualan ke dalam kategori untuk organisasi yang lebih baik</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Tambah Kategori Baru
        </button>
      </div>

      {/* Filter & Kontrol Cari */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama kategori (misal: Minuman, Makanan)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
      </div>

      {/* Tabel Data Kategori */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Nama Kategori</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-gray-500">
                    <RefreshCw className="animate-spin inline mr-2" size={18} />
                    Memuat data kategori...
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-8 text-gray-500">
                    Tidak ada data kategori ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 last:border-none ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-blue-50/40 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ubah Kategori"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY (TAMBAH & EDIT FORM) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingCategory ? 'Ubah Kategori Menu' : 'Tambah Kategori Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Isi Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Minuman Panas, Makanan Ringan, Dessert"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  <Save size={16} />
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
