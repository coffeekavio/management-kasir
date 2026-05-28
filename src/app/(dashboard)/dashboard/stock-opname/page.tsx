'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Plus, Save, AlertTriangle, Check, RefreshCw, Trash2, Eye } from 'lucide-react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { StockOpname, StockOpnameItem, Ingredient, StockOpnameFromDB, StockOpnameItemFromDB } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { api } from '@/services/api';
import { useAuthStore } from '@/lib/store'; 
import {
  modalConfirm,
  modalDeleteConfirm,
  modalLoading,
  modalSuccess,
  modalError as showModalError,
  modalInfo,
} from '@/components/Modals';

interface CompletedOpname extends StockOpname {
  completedAt?: string;
}

// Transform Supabase data to frontend format
const transformStockOpnameData = (dbData: StockOpnameFromDB, items: StockOpnameItemFromDB[] = []): CompletedOpname => {
  console.log('Transform SO:', { so_id: dbData.id, items_count: items.length, items });
  
  const products: StockOpnameItem[] = items.map((item) => ({
    ingredientId: item.ingredient_id,
    ingredientName: item.ingredient_name,
    unit: item.unit,
    systemStock: item.system_stock,
    physicalStock: item.physical_stock,
    difference: item.difference,
    cost: item.cost,
  }));

  return {
    id: dbData.id,
    cafe_id: dbData.cafe_id,
    date: new Date(dbData.created_at),
    products,
    totalValue: dbData.total_value,
    notes: dbData.notes || '',
    completedAt: dbData.created_at,
  };
};

export default function StockOpnamePage() {
  const [stockOpnameList, setStockOpnameList] = useState<StockOpname[]>([]);
  const [completedOpnames, setCompletedOpnames] = useState<CompletedOpname[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, string>>({});

  // Get activeCafeId dari Zustand store
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  // Load ingredients map untuk mencocokkan nama
  useEffect(() => {
    if (typeof window !== 'undefined' && activeCafeId) {
      const loadIngredients = async () => {
        try {
          const response = await api.get<{ data: Ingredient[] }>(`/api/ingredients/?cafe_id=${activeCafeId}`);
          const ingredients = response.data.data || [];
          
          // Create map of ingredient_id -> ingredient_name
          const map: Record<string, string> = {};
          ingredients.forEach((ing) => {
            map[ing.id] = ing.name;
          });
          
          setIngredientsMap(map);
          console.log('Ingredients map loaded:', map);
        } catch (error) {
          console.warn('Gagal load ingredients map:', error);
        }
      };
      
      loadIngredients();
    }
  }, [activeCafeId]);

  // Load completed opnames from API (Database sebagai source of truth)
  useEffect(() => {
    if (typeof window !== 'undefined' && activeCafeId) {
      const loadCompletedOpnames = async () => {
        setIsLoadingHistory(true);
        try {
          const response = await api.get<{ status: string; data: StockOpnameFromDB[] }>(
            `/api/stock-opname/list/${activeCafeId}`
          );
          
          if (response.data.data && Array.isArray(response.data.data)) {
            // Transform dan load detail untuk setiap stok opname
            const transformedData: CompletedOpname[] = await Promise.all(
              response.data.data.map(async (so) => {
                try {
                  // Fetch detail items untuk stok opname
                  const detailResponse = await api.get<{ status: string; data: { header: StockOpnameFromDB; items: StockOpnameItemFromDB[] } }>(
                    `/api/stock-opname/detail/${so.id}`
                  );
                  
                  console.log('Detail response untuk', so.id, ':', detailResponse.data);
                  
                  if (detailResponse.data.data && detailResponse.data.data.items) {
                    // Enrich items dengan nama dari ingredientsMap
                    const enrichedItems = detailResponse.data.data.items.map((item) => ({
                      ...item,
                      ingredient_name: item.ingredient_name || ingredientsMap[item.ingredient_id] || 'Tidak diketahui',
                    }));
                    
                    return transformStockOpnameData(so, enrichedItems);
                  }
                } catch (error) {
                  console.warn(`Gagal fetch detail untuk SO ${so.id}:`, error);
                }
                
                // Fallback: transform tanpa items jika detail fetch gagal
                return transformStockOpnameData(so, []);
              })
            );
            
            setCompletedOpnames(transformedData);
          }
        } catch (error) {
          console.error('Gagal fetch history dari API:', error);
          setCompletedOpnames([]);
        } finally {
          setIsLoadingHistory(false);
        }
      };
      
      loadCompletedOpnames();
    }
  }, [activeCafeId, ingredientsMap]);

  // Mencegah kebocoran data: Kosongkan DRAFT yang sedang dikerjakan jika pindah cafe
  useEffect(() => {
    setStockOpnameList([]);
  }, [activeCafeId]);

  // Fungsi untuk menarik data Bahan Baku dari API FastAPI
  const handleCreateStockOpname = useCallback(async () => {
    if (!activeCafeId) {
      showModalError('Cafe Belum Dipilih', 'Silakan pilih cafe terlebih dahulu');
      return;
    }

    setIsCreating(true);
    setIsLoading(true);

    try {
      // Fetch ingredients dari FastAPI
      const response = await api.get<{ data: Ingredient[] }>(`/api/ingredients/?cafe_id=${activeCafeId}`);
      const ingredientsData = response.data.data || [];

      if (ingredientsData.length === 0) {
        await modalInfo('Tidak ada bahan baku', 'Tidak ada bahan baku yang ditemukan. Silakan tambahkan bahan baku terlebih dahulu.');
        setIsCreating(false);
        setIsLoading(false);
        return;
      }

      const newItems: StockOpnameItem[] = ingredientsData.map((ing: Ingredient) => ({
        ingredientId: ing.id,
        ingredientName: ing.name,
        unit: ing.unit,
        systemStock: ing.stock,
        physicalStock: ing.stock, // Default disamakan dulu
        difference: 0,
        cost: ing.cost || 0,
      }));

      const totalValue = newItems.reduce((sum, item) => sum + item.physicalStock * item.cost, 0);

      const newStockOpname: StockOpname = {
        id: `SO-${Date.now()}`,
        cafe_id: activeCafeId,
        date: new Date(),
        products: newItems,
        totalValue,
        notes: '',
      };

      // Tambahkan ke paling atas (gunakan functional update untuk menghindari stale state)
      setStockOpnameList((prev) => [newStockOpname, ...prev]);
    } catch (error: unknown) {
      console.error('Gagal mengambil data bahan baku:', error);
      const errorMsg = error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data ? (error.response.data as { detail: string }).detail : 'Gagal memuat data bahan baku dari server.';
      showModalError('Gagal Memuat Bahan Baku', errorMsg);
    } finally {
      setIsCreating(false);
      setIsLoading(false);
    }
  }, [activeCafeId]);

  // Table columns for Draft Opname (StockOpname)
  const handleRemoveDraft = useCallback((id: string) => {
    setStockOpnameList((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleRemoveHistory = useCallback(async (id: string) => {
    const confirmed = await modalDeleteConfirm('Riwayat Opname', 'Hapus riwayat ini dari database?');
    if (!confirmed) return;

    try {
      const response = await api.delete(`/api/stock-opname/${id}`);
      if (response.data.status === 'success') {
        setCompletedOpnames((prev) => prev.filter((item) => item.id !== id));
        modalSuccess('Terhapus', 'Riwayat stok opname dihapus');
      }
    } catch (error) {
      console.error('Gagal menghapus stok opname:', error);
      showModalError('Gagal', 'Gagal menghapus stok opname dari database');
    }
  }, []);

  const draftColumns = useMemo<MRT_ColumnDef<StockOpname>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
      },
      {
        accessorKey: 'date',
        header: 'Tanggal',
        Cell: ({ cell }) => formatDate(cell.getValue() as Date),
      },
      {
        accessorKey: 'totalValue',
        header: 'Total Nilai',
        Cell: ({ cell }) => formatCurrency(cell.getValue() as number),
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const so = row.original;
                const confirmed = await modalConfirm(
                  'Simpan Stok Opname',
                  'Yakin ingin menyimpan stok opname ini ke database?',
                  'Ya, Simpan',
                  'Batal',
                  'question'
                );
                if (!confirmed) return;
                modalLoading('Menyimpan stok opname...');
                try {
                  await handleSaveToDatabase(so);
                  modalSuccess('Berhasil', 'Stok opname disimpan');
                } catch (err) {
                  console.error(err);
                  showModalError('Gagal', 'Gagal menyimpan stok opname');
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Simpan
            </button>
            <button
              onClick={async () => {
                const so = row.original;
                const confirmed = await modalDeleteConfirm('Draft Opname', 'Aksi menghapus draft ini tidak dapat dikembalikan.');
                if (!confirmed) return;
                setStockOpnameList((prev) => prev.filter((s) => s.id !== so.id));
              }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Hapus
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // Table columns for Completed Opname
  const historyColumns = useMemo<MRT_ColumnDef<CompletedOpname>[]>(
    () => [
      {
        id: 'id',
        header: 'ID',
        accessorKey: 'id',
      },
      {
        accessorKey: 'date',
        header: 'Tanggal',
        Cell: ({ cell }) => formatDate(cell.getValue() as Date),
      },
      {
        accessorKey: 'totalValue',
        header: 'Total Nilai',
        Cell: ({ cell }) => formatCurrency(cell.getValue() as number),
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRemoveHistory(row.original.id)}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Hapus
            </button>
          </div>
        ),
      },
    ],
    [handleRemoveHistory]
  );

  const draftTable = useMaterialReactTable({
    columns: draftColumns,
    data: stockOpnameList,
    enableColumnFilters: false,
    enableSorting: true,
    enableGlobalFilter: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    muiSearchTextFieldProps: { placeholder: 'Cari draft opname...' },
  });

  const historyTable = useMaterialReactTable({
    columns: historyColumns,
    data: completedOpnames,
    enableColumnFilters: false,
    enableSorting: true,
    enableGlobalFilter: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    muiSearchTextFieldProps: { placeholder: 'Cari riwayat opname...' },
  });

  // Fungsi saat Manager mengetik angka stok fisik (Bisa Desimal)
  const handleUpdatePhysicalStock = (
    stockOpnameId: string,
    ingredientId: string,
    physicalStock: number
  ) => {
    setStockOpnameList(
      stockOpnameList.map((so) =>
        so.id === stockOpnameId
          ? {
              ...so,
              products: so.products.map((item) =>
                item.ingredientId === ingredientId
                  ? {
                      ...item,
                      physicalStock,
                      difference: physicalStock - item.systemStock,
                    }
                  : item
              ),
              // Hitung ulang total nilai uangnya
              totalValue: so.products.reduce((sum, item) => {
                if (item.ingredientId === ingredientId) {
                  return sum + physicalStock * item.cost;
                }
                return sum + item.physicalStock * item.cost;
              }, 0),
            }
          : so
      )
    );
  };

  // Fungsi untuk menyimpan perubahan ke Database via FastAPI
  const handleSaveToDatabase = async (so: StockOpname) => {
    if (!activeCafeId) {
      showModalError('Cafe Belum Dipilih', 'Silakan pilih cafe terlebih dahulu');
      return;
    }

    try {
      const payload = {
        cafe_id: activeCafeId,
        total_value: so.totalValue,
        notes: so.notes,
        items: so.products.map((item) => ({
          ingredient_id: item.ingredientId,
          system_stock: item.systemStock,
          physical_stock: item.physicalStock,
          difference: item.difference,
          cost: item.cost,
        })),
      };

      const response = await api.post('/api/stock-opname/save', payload);

      if (response.data.status === 'success') {
        await modalSuccess('✓ Stok Opname berhasil disimpan!', response.data.message || '');
        
        // Hapus SO dari list draft
        setStockOpnameList(stockOpnameList.filter((item) => item.id !== so.id));
        
        // Refresh data dari API untuk sync dengan database terbaru
        try {
          const refreshResponse = await api.get<{ status: string; data: StockOpnameFromDB[] }>(
            `/api/stock-opname/list/${activeCafeId}`
          );
          
          if (refreshResponse.data.data && Array.isArray(refreshResponse.data.data)) {
            // Transform dan load detail untuk setiap stok opname
            const transformedData: CompletedOpname[] = await Promise.all(
              refreshResponse.data.data.map(async (so) => {
                try {
                  const detailResponse = await api.get<{ status: string; data: { header: StockOpnameFromDB; items: StockOpnameItemFromDB[] } }>(
                    `/api/stock-opname/detail/${so.id}`
                  );
                  
                  console.log('Detail response untuk', so.id, ':', detailResponse.data);
                  
                  if (detailResponse.data.data && detailResponse.data.data.items) {
                    // Enrich items dengan nama dari ingredientsMap
                    const enrichedItems = detailResponse.data.data.items.map((item) => ({
                      ...item,
                      ingredient_name: item.ingredient_name || ingredientsMap[item.ingredient_id] || 'Tidak diketahui',
                    }));
                    
                    return transformStockOpnameData(so, enrichedItems);
                  }
                } catch (error) {
                  console.warn(`Gagal fetch detail untuk SO ${so.id}:`, error);
                }
                
                return transformStockOpnameData(so, []);
              })
            );
            
            setCompletedOpnames(transformedData);
          }
        } catch (error) {
          console.error('Gagal refresh data dari API:', error);
        }
      }
    } catch (error: unknown) {
      console.error('Gagal menyimpan stok opname:', error);
      const errorMsg = error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data ? (error.response.data as { detail: string }).detail : 'Gagal menyimpan stok opname ke database.';
      showModalError('Gagal Menyimpan', errorMsg);
    }
  };

  // Fungsi untuk refresh/reload riwayat dari database
  const handleRefreshHistory = async () => {
    if (!activeCafeId) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await api.get<{ status: string; data: StockOpnameFromDB[] }>(
        `/api/stock-opname/list/${activeCafeId}`
      );
      
      if (response.data.data && Array.isArray(response.data.data)) {
        // Transform dan load detail untuk setiap stok opname
        const transformedData: CompletedOpname[] = await Promise.all(
          response.data.data.map(async (so) => {
            try {
              const detailResponse = await api.get<{ status: string; data: { header: StockOpnameFromDB; items: StockOpnameItemFromDB[] } }>(
                `/api/stock-opname/detail/${so.id}`
              );
              
              console.log('Detail response untuk', so.id, ':', detailResponse.data);
              
              if (detailResponse.data.data && detailResponse.data.data.items) {
                // Enrich items dengan nama dari ingredientsMap
                const enrichedItems = detailResponse.data.data.items.map((item) => ({
                  ...item,
                  ingredient_name: item.ingredient_name || ingredientsMap[item.ingredient_id] || 'Tidak diketahui',
                }));
                
                return transformStockOpnameData(so, enrichedItems);
              }
            } catch (error) {
              console.warn(`Gagal fetch detail untuk SO ${so.id}:`, error);
            }
            
            return transformStockOpnameData(so, []);
          })
        );
        
        setCompletedOpnames(transformedData);
      }
    } catch (error) {
      console.error('Gagal refresh history dari API:', error);
      showModalError('Gagal Memuat Riwayat', 'Gagal memuat riwayat stok opname');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Stok Opname (Gudang)</h1>
            <p className="text-gray-600 mt-1">Verifikasi stok fisik bahan baku dengan sistem</p>
          </div>
          <button
            onClick={handleCreateStockOpname}
            disabled={isLoading || isCreating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:bg-blue-400"
          >
            {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
            Buat Opname Baru
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft Opname</p>
                <p className="text-2xl font-bold text-blue-600">{stockOpnameList.length}</p>
              </div>
              <Plus className="text-blue-500 opacity-20" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selesai</p>
                <p className="text-2xl font-bold text-green-600">{completedOpnames.length}</p>
              </div>
              <Check className="text-green-500 opacity-20" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Nilai Aset</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    stockOpnameList.reduce((sum, so) => sum + so.totalValue, 0) +
                    completedOpnames.reduce((sum, so) => sum + so.totalValue, 0)
                  )}
                </p>
              </div>
              <RefreshCw className="text-purple-500 opacity-20" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Draft Opnames Section (Material React Table) */}
      {stockOpnameList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">📝 Draft Opname (Belum Disimpan)</h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">{stockOpnameList.length} draft</span>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-200 p-4">
            <MaterialReactTable table={draftTable} />
          </div>
        </div>
      )}

      {/* Empty State jika tidak ada data sama sekali */}
      {stockOpnameList.length === 0 && completedOpnames.length === 0 && !isLoadingHistory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <Plus className="mx-auto text-blue-400 mb-3" size={40} />
          <h3 className="text-lg font-semibold text-gray-800">Belum ada Stok Opname</h3>
          <p className="text-gray-600 mt-1">Mulai dengan membuat stok opname baru menggunakan tombol di atas</p>
        </div>
      )}

      {/* Loading State untuk History */}
      {isLoadingHistory && completedOpnames.length === 0 && stockOpnameList.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <RefreshCw className="mx-auto text-blue-400 mb-3 animate-spin" size={40} />
          <h3 className="text-lg font-semibold text-gray-800">Memuat Riwayat Stok Opname...</h3>
          <p className="text-gray-600 mt-1">Mengambil data dari database untuk cafe ini</p>
        </div>
      )}

      {/* Completed Opnames Section (Material React Table) */}
      {completedOpnames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">✓ Riwayat Stok Opname (Selesai)</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshHistory}
                disabled={isLoadingHistory}
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-semibold rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} /> Refresh
              </button>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">{completedOpnames.length} selesai</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden p-4">
            <MaterialReactTable table={historyTable} />
          </div>
        </div>
      )}
    </div>
  );
}