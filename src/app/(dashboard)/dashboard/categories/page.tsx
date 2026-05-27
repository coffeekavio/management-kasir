'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { menuService, type Category } from '@/services/menuService';
import { useAuthStore } from '@/lib/store';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  modalConfirm,
  modalDeleteConfirm,
  modalLoading,
  modalSuccess,
  modalError as showModalError,
} from '@/components/Modals';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
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
        return;
      }

      const data = await menuService.getCategories(activeCafeId);
      setCategories(data);
    } catch (error: unknown) {
      console.error('Gagal memuat data kategori:', error);
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
      showModalError('Cafe Belum Dipilih', 'Silakan pilih cafe terlebih dahulu dari dropdown di navbar');
      return;
    }

    const confirmed = await modalConfirm(
      editingCategory ? 'Simpan perubahan kategori?' : 'Tambah kategori baru?',
      editingCategory
        ? 'Perubahan kategori akan disimpan ke server.'
        : 'Data kategori baru akan ditambahkan ke server.',
      'Ya, Simpan',
      'Batal',
      'question'
    );

    if (!confirmed) {
      return;
    }

    try {
      modalLoading('Menyimpan kategori...');

      if (editingCategory) {
        await menuService.updateCategory(editingCategory.id, formData.name, activeCafeId);
        modalSuccess('Berhasil', 'Kategori berhasil diperbarui!');
      } else {
        await menuService.createCategory(activeCafeId, formData.name);
        modalSuccess('Berhasil', 'Kategori berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      setFormData({ name: '' });
      fetchCategories();
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

      showModalError('Gagal Menyimpan Kategori', errorMessage);
    }
  };

  // Menangani Hapus Data
  const handleDelete = async (id: string) => {
    const confirmed = await modalDeleteConfirm(
      'Kategori Menu',
      'Kategori yang terikat menu tidak bisa dihapus.'
    );

    if (!confirmed) {
      return;
    }

    try {
      modalLoading('Menghapus kategori...');
      await menuService.deleteCategory(id, activeCafeId);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      modalSuccess('Terhapus', 'Kategori berhasil dihapus!');
    } catch (error) {
      console.error('Gagal menghapus kategori:', error);

      let errorMessage = 'Gagal menghapus kategori dari server.';

      if (error instanceof Error) {
        if ('response' in error && typeof error.response === 'object' && error.response !== null) {
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
        errorMessage = JSON.stringify(error);
      }

      showModalError('Gagal Menghapus Kategori', errorMessage);
    }
  };

  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        size: 70,
        enableSorting: false,
        Cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          return pageIndex * pageSize + row.index + 1;
        },
      },
      {
        accessorKey: 'name',
        header: 'Nama Kategori',
      },
      {
        id: 'actions',
        header: 'Aksi',
        size: 120,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenEditModal(row.original)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Ubah Kategori"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Hapus Kategori"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, handleOpenEditModal]
  );

  const table = useMaterialReactTable({
    columns,
    data: categories,
    state: {
      isLoading,
    },
    enableGlobalFilter: true,
    enableSorting: true,
    enablePagination: true,
    enableColumnFilters: false,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    muiSearchTextFieldProps: {
      placeholder: 'Cari nama kategori...',
      variant: 'outlined',
      size: 'small',
    },
  });

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

      {/* Tabel Data Kategori */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <MaterialReactTable table={table} />
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
