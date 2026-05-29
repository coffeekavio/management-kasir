'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Save, Coffee, Layers, Eye, EyeOff, CheckSquare, Square, Trash, Heart } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { menuService, type Category, type Ingredient, type RecipeItemInput, type Menu } from '@/services/menuService';
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

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Get activeCafeId dari Zustand store
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  // Modals Toggles
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  
  // State Edit
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  // Form State Menu
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    isAvailable: true,
    trackStock: false,
    isFavorite: false,
  });
  
  // State khusus baris resep yang sedang diracik di dalam modal form menu
  const [recipeItems, setRecipeItems] = useState<RecipeItemInput[]>([]);

  // Fungsi untuk menghitung total HPP dari resep
  const calculateTotalCost = (): number => {
    return recipeItems.reduce((total, item) => {
      const ingredient = ingredients.find((i) => i.id === item.ingredientId);
      const unitCost = ingredient?.cost || 0;
      return total + (unitCost * item.quantity);
    }, 0);
  };

  // Fungsi untuk menghitung profit
  const calculateProfit = (): { profit: number; percentage: number } => {
    const totalCost = calculateTotalCost();
    const sellingPrice = menuForm.price;
    const profit = sellingPrice - totalCost;
    const percentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    return { profit, percentage };
  };

  // Mengambil seluruh data awal (Menu, Kategori, Bahan Baku)
  const fetchData = useCallback(async () => {
    try {
      if (!activeCafeId) {
        return;
      }

      setIsLoading(true);

      // 1. Fetch Kategori
      const categoriesData = await menuService.getCategories(activeCafeId);
      setCategories(categoriesData);

      // 2. Fetch Master Bahan Baku
      const ingredientsData = await menuService.getIngredients(activeCafeId);
      setIngredients(ingredientsData);

      // 3. Fetch Menu beserta array resepnya
      const menusData = await menuService.getMenus(activeCafeId);
      setMenus(menusData);
    } catch (error: unknown) {
      console.error('Gagal mengambil data master menu:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeCafeId]);

  useEffect(() => {
    if (activeCafeId) {
      fetchData();
    }
  }, [activeCafeId, fetchData]);

  // Membuka Modal Pembuatan Menu Baru
  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      name: '',
      description: '',
      price: 0,
      categoryId: categories[0]?.id || '',
      isAvailable: true,
      trackStock: false,
      isFavorite: false,
    });
    setRecipeItems([]);
    setIsMenuModalOpen(true);
  };

  // Membuka Modal Perubahan Data Menu
  const handleOpenEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuForm({
      name: menu.name,
      description: menu.description,
      price: menu.price,
      categoryId: menu.categoryId,
      isAvailable: menu.isAvailable,
      trackStock: menu.trackStock,
      isFavorite: menu.isFavorite || false,
    });
    setRecipeItems(menu.recipe || []);
    setIsMenuModalOpen(true);
  };

  // Menambah Baris Bahan Baku Baru ke dalam Resep Menu
  const addRecipeRow = () => {
    if (ingredients.length === 0) return;
    setRecipeItems([...recipeItems, { ingredientId: ingredients[0].id, quantity: 0 }]);
  };

  // Mengubah isi baris resep tertentu (Dropdown bahan atau angka takaran)
  const updateRecipeRow = (index: number, field: keyof RecipeItemInput, value: string | number) => {
    setRecipeItems(
      recipeItems.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  // Menghapus baris resep dari rancangan
  const removeRecipeRow = (index: number) => {
    setRecipeItems(recipeItems.filter((_, idx) => idx !== index));
  };

  // Toggle Favorit Status Menu
  const handleToggleFavorite = async (menu: Menu) => {
    try {
      modalLoading(menu.isFavorite ? 'Menghapus dari favorit...' : 'Menambah ke favorit...');
      await menuService.toggleFavorite(menu.id, !menu.isFavorite);
      
      // Update local state
      setMenus((prev) =>
        prev.map((m) =>
          m.id === menu.id ? { ...m, isFavorite: !m.isFavorite } : m
        )
      );
      
      modalSuccess(
        'Berhasil',
        menu.isFavorite ? `Menu "${menu.name}" dihapus dari favorit` : `Menu "${menu.name}" ditambahkan ke favorit`
      );
    } catch (error: unknown) {
      console.error('Gagal mengubah status favorit:', error);
      const errorMsg = error instanceof Error ? error.message : 'Gagal mengubah status favorit';
      showModalError('Gagal', errorMsg);
    }
  };

  // Submit Simpan Form Menu (POST/PUT)
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input wajib
    if (!menuForm.name.trim()) {
      alert('Nama menu wajib diisi!');
      return;
    }
    if (!menuForm.categoryId) {
      alert('Silakan pilih kategori terlebih dahulu!');
      return;
    }
    if (menuForm.price <= 0) {
      alert('Harga jual harus lebih besar dari 0!');
      return;
    }

    const saveConfirmed = await modalConfirm(
      editingMenu ? 'Simpan perubahan menu?' : 'Tambah menu baru?',
      editingMenu
        ? 'Perubahan data menu akan disimpan ke server.'
        : 'Data menu baru akan ditambahkan ke server.',
      'Ya, Simpan',
      'Batal',
      'question'
    );

    if (!saveConfirmed) {
      return;
    }

    try {
      if (!activeCafeId) {
        alert('ID Kafe tidak ditemukan. Silakan login ulang.');
        return;
      }

      modalLoading('Menyimpan menu...');

      // Mempersiapkan payload data
      const payload = {
        cafe_id: activeCafeId,
        category_id: menuForm.categoryId,
        name: menuForm.name,
        description: menuForm.description || null,
        price: Number(menuForm.price),
        is_available: menuForm.isAvailable,
        is_favorite: menuForm.isFavorite,
        track_stock: menuForm.trackStock,
        // Jika trackStock true, kirim array recipe, jika false kirim array kosong
        recipe: menuForm.trackStock 
          ? recipeItems.map((item) => ({
              ingredient_id: item.ingredientId,
              quantity: Number(item.quantity),
            }))
          : [],
      };

      if (editingMenu) {
        // EDIT MENU
        await menuService.updateMenu(editingMenu.id, payload);
        modalSuccess('Berhasil', `Menu "${menuForm.name}" berhasil diperbarui!`);
      } else {
        // TAMBAH MENU BARU
        await menuService.createMenu(payload);
        modalSuccess('Berhasil', `Menu "${menuForm.name}" berhasil ditambahkan ke kasir!`);
      }

      // Tutup modal dan refresh data dari database
      setIsMenuModalOpen(false);
      fetchData(); 
      
    } catch (error: unknown) {
      console.error('Gagal menyimpan menu:', error);
      const errorMsg = error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data ? (error.response.data as { detail: string }).detail : 'Terjadi kesalahan pada server.';
      showModalError('Gagal Menyimpan Menu', errorMsg);
    }
  };

  // Hapus Menu
  const handleDeleteMenu = async (id: string) => {
    const confirmed = await modalDeleteConfirm('Menu Jualan', 'Produk jualan ini akan dihapus dari sistem');

    if (!confirmed) return;

    try {
      modalLoading('Menghapus menu...');
      await menuService.deleteMenu(id);
      setMenus((prev) => prev.filter((m) => m.id !== id));
      modalSuccess('Terhapus', 'Menu berhasil dihapus');
    } catch (err: unknown) {
      console.error('Gagal menghapus menu:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus menu';
      showModalError('Gagal Menghapus Menu', errorMsg);
    }
  };

  const filteredMenus = useMemo(() => menus.filter((menu) => (
    selectedCategoryFilter === 'all' || menu.categoryId === selectedCategoryFilter
  )), [menus, selectedCategoryFilter]);

  const columns = useMemo<MRT_ColumnDef<Menu>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        size: 60,
        enableSorting: false,
        Cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination || { pageIndex: 0, pageSize: 10 };
          return pageIndex * pageSize + row.index + 1;
        },
      },
      {
        accessorKey: 'name',
        header: 'Nama Menu',
      },
      {
        accessorKey: 'categoryId',
        header: 'Kategori',
        Cell: ({ cell }) => {
          const catName = categories.find((c) => c.id === cell.getValue<string>())?.name || '-';
          return <span className="font-medium text-gray-700">{catName}</span>;
        },
      },
      {
        accessorKey: 'price',
        header: 'Harga',
        Cell: ({ cell }) => formatCurrency(cell.getValue<number>() || 0),
      },
      {
        accessorKey: 'trackStock',
        header: 'Resep',
        Cell: ({ cell, row }) => (cell.getValue<boolean>() ? `${row.original.recipe?.length || 0} bahan` : 'Instan'),
      },
      {
        accessorKey: 'isAvailable',
        header: 'Status',
        Cell: ({ cell }) => (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cell.getValue<boolean>() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {cell.getValue<boolean>() ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
      },
      {
        accessorKey: 'isFavorite',
        header: 'Favorit',
        enableSorting: false,
        Cell: ({ row }) => (
          <button
            onClick={() => handleToggleFavorite(row.original)}
            className={`inline-flex items-center justify-center p-1.5 rounded transition-colors ${
              row.original.isFavorite
                ? 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100'
            }`}
            title={row.original.isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            <Heart size={16} fill={row.original.isFavorite ? 'currentColor' : 'none'} />
          </button>
        ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenEditMenu(row.original)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
            >
              <Edit2 size={13} />
              Ubah
            </button>
            <button
              onClick={() => handleDeleteMenu(row.original.id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              <Trash2 size={13} />
              Hapus
            </button>
          </div>
        ),
      },
    ],
    [categories]
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredMenus,
    state: {
      isLoading,
    },
    enableColumnFilterModes: true,
    enableGlobalFilter: true,
    enablePagination: true,
    enableSorting: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    muiTableProps: {
      sx: {
        borderCollapse: 'collapse',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 16px',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: '#374151',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        padding: '12px 16px',
        fontSize: '0.875rem',
      },
    },
    muiTableBodyRowProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#f0f4f8',
        },
        borderBottom: '1px solid #f3f4f6',
      },
    },
    muiSearchTextFieldProps: {
      placeholder: 'Cari nama menu...',
      variant: 'outlined',
      size: 'small',
      fullWidth: false,
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Daftar Menu & Produk</h1>
          <p className="text-gray-600 mt-1">Kelola varian menu jualan kasir beserta manajemen komposisi resep</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/categories"
            className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Layers size={18} />
            Manajemen Kategori
          </Link>
          <button
            onClick={handleOpenAddMenu}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Plus size={18} />
            Tambah Menu Baru
          </button>
        </div>
      </div>

      {/* Kontrol Filter Kategori */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row gap-4 border border-gray-100">
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <div className="text-sm font-semibold text-gray-700">Filter Kategori:</div>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategoryFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Semua Produk
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategoryFilter === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table Menu Jualan */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="min-w-full">
          <MaterialReactTable table={table} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL TAMBAH & EDIT MENU JUALAN + RACIK RESEP (BOM)  */}
      {/* ======================================================== */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 my-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">{editingMenu ? 'Ubah Informasi Menu' : 'Tambah Menu Jualan Baru'}</h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama Menu</label>
                  <input
                    type="text"
                    required
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    placeholder="Misal: Avocado Latte"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kategori Kelompok</label>
                  <select
                    value={menuForm.categoryId}
                    onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Harga Jual Kasir (Rupiah)</label>
                <input
                  type="number"
                  required
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({ ...menuForm, price: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Produk</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Keterangan bahan/rasa untuk info kasir..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 outline-none resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SWITCHER OPSI: TRACK STOCK BAHAN BAKU */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Hubungkan Ke Stok Bahan Baku</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Otomatis sembunyikan menu di kasir jika bahan mentah di gudang habis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuForm({ ...menuForm, trackStock: !menuForm.trackStock })}
                  className={`p-1 rounded transition-colors ${menuForm.trackStock ? 'text-blue-600' : 'text-gray-400'}`}
                >
                  {menuForm.trackStock ? <CheckSquare size={26} /> : <Square size={26} />}
                </button>
              </div>

              {/* DINAMIS SUB-FORM RACIKAN RESEP (Hanya Muncul Jika trackStock = TRUE) */}
              {menuForm.trackStock && (
                <div className="space-y-4">
                  <div className="border border-purple-100 bg-purple-50/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                    <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                      <Coffee size={14} /> Racikan Komposisi Resep
                    </h4>
                    <button
                      type="button"
                      onClick={addRecipeRow}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-2.5 py-1 rounded-md transition-colors"
                    >
                      + Tambah Bahan
                    </button>
                  </div>

                  {recipeItems.length === 0 ? (
                    <p className="text-center text-xs text-purple-400 py-3">Belum ada bahan baku dapur yang ditautkan.</p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {recipeItems.map((item, index) => {
                        const currentIng = ingredients.find((i) => i.id === item.ingredientId);
                        return (
                          <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm border border-purple-100/50">
                            {/* Dropdown Pilihan Komoditas Gudang */}
                            <select
                              value={item.ingredientId}
                              onChange={(e) => updateRecipeRow(index, 'ingredientId', e.target.value)}
                              className="flex-1 px-2 py-1.5 border border-gray-200 bg-transparent rounded text-xs text-gray-700 outline-none"
                            >
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name}
                                </option>
                              ))}
                            </select>

                            {/* Input Nominal Kuantitas Kebutuhan */}
                            <div className="flex items-center gap-1.5 w-28">
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={item.quantity || ''}
                                onChange={(e) => updateRecipeRow(index, 'quantity', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-center font-bold text-gray-800"
                              />
                              <span className="text-[11px] text-gray-400 font-semibold w-8 text-left uppercase">
                                {currentIng?.unit || 'unit'}
                              </span>
                            </div>

                            {/* Tombol Hapus Baris */}
                            <button
                              type="button"
                              onClick={() => removeRecipeRow(index)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  </div>

                  {/* KALKULATOR HPP & PROFIT REAL-TIME */}
                  {recipeItems.length > 0 && (
                    <div className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-4 space-y-3">
                      <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">📊 Analisis Profitabilitas</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* Box HPP Total */}
                        <div className="bg-white/80 border border-purple-200 rounded-lg p-3">
                          <p className="text-[11px] text-purple-600 font-semibold mb-1">HPP Total Resep</p>
                          <p className="text-lg font-bold text-purple-900">{formatCurrency(calculateTotalCost())}</p>
                          <p className="text-[10px] text-purple-500 mt-1">({recipeItems.length} bahan)</p>
                        </div>

                        {/* Box Harga Jual */}
                        <div className="bg-white/80 border border-purple-200 rounded-lg p-3">
                          <p className="text-[11px] text-purple-600 font-semibold mb-1">Harga Jual Menu</p>
                          <p className="text-lg font-bold text-purple-900">{formatCurrency(menuForm.price)}</p>
                          <p className="text-[10px] text-purple-500 mt-1">Harga kasir</p>
                        </div>
                      </div>

                      {/* Profit Indicator */}
                      {(() => {
                        const { profit, percentage } = calculateProfit();
                        const isProfit = profit > 0;
                        return (
                          <div className={`border-l-4 rounded p-3 ${isProfit ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-xs font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                                  {isProfit ? '✓ Keuntungan' : '⚠ Rugi'}
                                </p>
                                <p className={`text-sm font-bold mt-0.5 ${isProfit ? 'text-green-900' : 'text-red-900'}`}>
                                  {formatCurrency(profit)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentage.toFixed(1)}%
                                </p>
                                <p className={`text-[10px] font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                  Margin Profit
                                </p>
                              </div>
                            </div>
                            {percentage < 20 && isProfit && (
                              <p className="text-[10px] text-amber-700 mt-2 bg-amber-100/50 px-2 py-1 rounded">
                                💡 Margin di bawah 20%. Pertimbangkan naikkan harga atau kurangi bahan.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Visibilitas Manual Status Ketersediaan */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAvailableCheckbox"
                  checked={menuForm.isAvailable}
                  onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="isAvailableCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Aktifkan Menu (Langsung Muncul di Layar Kasir Flutter)
                </label>
              </div>

              {/* Favorit Menu */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFavoriteCheckbox"
                  checked={menuForm.isFavorite}
                  onChange={(e) => setMenuForm({ ...menuForm, isFavorite: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded"
                />
                <label htmlFor="isFavoriteCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                  <Heart size={14} className="text-red-600" />
                  Tandai Sebagai Menu Favorit
                </label>
              </div>

              {/* Tombol Simpan Form */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-xs transition-colors"
                >
                  <Save size={15} /> Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}