'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, X, Save, RefreshCw } from 'lucide-react';
import { Ingredient } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ingredientService } from '@/services/ingredientService';
import { useAuthStore } from '@/lib/store';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Get activeCafeId dari Zustand store (bisa berubah dari navbar dropdown)
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  // State Form Input
  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    unit: 'gram',
    cost: 0,
  });

  // Fungsi fetch data bahan baku
  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
      // Gunakan activeCafeId dari store (bisa berubah dari navbar dropdown)
      if (!activeCafeId) {
        setIsLoading(false);
        return;
      }

      const data = await ingredientService.getIngredientsByCafe(activeCafeId);
      setIngredients(data);
    } catch (error: unknown) {
      console.error('Gagal memuat data bahan baku:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCafeId]);

  // Auto-refresh ketika activeCafeId berubah (user ganti cafe dari navbar)
  useEffect(() => {
    if (activeCafeId) {
      fetchIngredients();
    }
  }, [activeCafeId, fetchIngredients]);

  // Membuka Modal Tambah Baru
  const handleOpenAddModal = () => {
    setEditingIngredient(null);
    setFormData({ name: '', stock: 0, unit: 'gram', cost: 0 });
    setIsModalOpen(true);
  };

  // Membuka Modal Edit
  const handleOpenEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      stock: ingredient.stock,
      unit: ingredient.unit,
      cost: ingredient.cost || 0,
    });
    setIsModalOpen(true);
  };

  // Menangani Simpan Data (Tambah & Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Gunakan activeCafeId dari store
    if (!activeCafeId) {
      alert('Error: Silakan pilih cafe terlebih dahulu dari dropdown di navbar');
      return;
    }

    try {
      const payload = {
        cafe_id: activeCafeId,
        ...formData,
      };

      if (editingIngredient) {
        // EDIT: Update ke server
        await ingredientService.updateIngredient(editingIngredient.id, payload);
      } else {
        // TAMBAH: Tambah baru ke server
        await ingredientService.createIngredient(payload);
      }
      
      setIsModalOpen(false);
      setFormData({ name: '', stock: 0, unit: 'gram', cost: 0 });
      fetchIngredients(); // Refresh data setelah simpan
    } catch (error: unknown) {
      console.error('Gagal menyimpan bahan baku:', error);
      
      let errorMessage = 'Gagal menyimpan perubahan ke server.';
      
      if (error instanceof Error) {
        if (error.message === 'Network Error - Pastikan API Server sedang berjalan') {
          errorMessage = error.message;
        } else if ('response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data) {
          errorMessage = (error.response.data as { detail: string }).detail;
        } else if ('detail' in error && typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else {
          errorMessage = error.message;
        }
      } else if (typeof error === 'object' && error !== null && 'detail' in error && typeof error.detail === 'string') {
        errorMessage = error.detail;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  // Menangani Hapus Data
  const handleDelete = async (id: string) => {
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus bahan baku ini? Menghapus bahan baku dapat memengaruhi menu jualan yang terikat dengan resep ini.'
      )
    ) {
      try {
        // HAPUS: Hapus dari server
        await ingredientService.deleteIngredient(id);
        setIngredients(ingredients.filter((ing) => ing.id !== id));
      } catch (error) {
        console.error('Gagal menghapus data:', error);
        alert('Gagal menghapus data dari server.');
      }
    }
  };

  // Pencarian realtime
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Master Bahan Baku</h1>
          <p className="text-gray-600 mt-1">Daftar stok induk komoditas gudang dapur kafe</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Tambah Bahan Baku
        </button>
      </div>

      {/* Filter & Kontrol Cari */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama bahan baku (misal: Susu, Kopi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
      </div>

      {/* Tabel Data Master */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Nama Bahan</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Sisa Stok</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Satuan</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Harga per Satuan</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    <RefreshCw className="animate-spin inline mr-2" size={18} />
                    Memuat data gudang...
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Tidak ada data bahan baku ditemukan.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 last:border-none ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    } hover:bg-blue-50/40 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700">
                      {item.stock}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider uppercase border border-gray-200">
                        {item.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-800 font-medium font-mono">
                      {formatCurrency(item.cost || 0)} <span className="text-xs text-gray-400">/{item.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ubah Data"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Data"
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
                {editingIngredient ? 'Ubah Informasi Bahan Baku' : 'Tambah Master Bahan Baku Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Isi Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Bahan Baku</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Susu UHT Fullcream Diamond"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm text-center font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Satuan Ukur</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm font-medium"
                  >
                    <option value="gram">gram</option>
                    <option value="ml">ml (Mililiter)</option>
                    <option value="pcs">pcs (Satuan)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="liter">liter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Harga Pokok Beli <span className="text-xs text-gray-400">(Per Satuan)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-medium text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                    placeholder="Harga kulakan awal"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm font-mono"
                  />
                </div>
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
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}