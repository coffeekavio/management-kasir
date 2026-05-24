'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Save, AlertTriangle, Check, RefreshCw, Trash2, Eye } from 'lucide-react';
import { StockOpname, StockOpnameItem, Ingredient, StockOpnameFromDB, StockOpnameItemFromDB } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { api } from '@/services/api';
import { useAuthStore } from '@/lib/store'; 

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
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null);
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
      alert('Error: Silakan pilih cafe terlebih dahulu');
      return;
    }

    setIsCreating(true);
    setIsLoading(true);

    try {
      // Fetch ingredients dari FastAPI
      const response = await api.get<{ data: Ingredient[] }>(`/api/ingredients/?cafe_id=${activeCafeId}`);
      const ingredientsData = response.data.data || [];

      if (ingredientsData.length === 0) {
        alert('Tidak ada bahan baku yang ditemukan. Silakan tambahkan bahan baku terlebih dahulu.');
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

      // Tambahkan ke paling atas
      setStockOpnameList([newStockOpname, ...stockOpnameList]);
    } catch (error: unknown) {
      console.error('Gagal mengambil data bahan baku:', error);
      const errorMsg = error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data ? (error.response.data as { detail: string }).detail : 'Gagal memuat data bahan baku dari server.';
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsCreating(false);
      setIsLoading(false);
    }
  }, [activeCafeId, stockOpnameList]);

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
      alert('Error: Silakan pilih cafe terlebih dahulu');
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
        alert(`✓ Stok Opname berhasil disimpan!\n${response.data.message}`);
        
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
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleClearCompleted = async (id: string) => {
    if (confirm('Hapus dari riwayat?')) {
      try {
        const response = await api.delete(`/api/stock-opname/${id}`);
        if (response.data.status === 'success') {
          // Remove dari UI
          const updated = completedOpnames.filter((item) => item.id !== id);
          setCompletedOpnames(updated);
        }
      } catch (error) {
        console.error('Gagal menghapus stok opname:', error);
        alert('Gagal menghapus stok opname dari database');
      }
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
      alert('Gagal memuat riwayat stok opname');
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

      {/* Draft Opnames Section */}
      {stockOpnameList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">📝 Draft Opname (Belum Disimpan)</h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {stockOpnameList.length} draft
            </span>
          </div>

          {stockOpnameList.map((so) => (
            <div key={so.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-200">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{so.id}</h3>
                    <p className="text-blue-100 text-sm">Tanggal: {formatDate(so.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-100">Nilai Aset</p>
                    <p className="text-2xl font-bold">{formatCurrency(so.totalValue)}</p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Bahan Baku</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">Satuan</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">Sistem</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">Fisik</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">Selisih</th>
                      <th className="px-6 py-3 text-center font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {so.products.map((item, idx) => (
                      <tr key={item.ingredientId} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{item.ingredientName}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-800 font-semibold">
                          {item.systemStock}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input
                            type="number"
                            step="0.01"
                            value={item.physicalStock}
                            onChange={(e) => handleUpdatePhysicalStock(so.id, item.ingredientId, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none text-black"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className={`font-semibold ${item.difference === 0 ? 'text-gray-800' : item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.difference > 0 ? '+' : ''}{item.difference}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.difference === 0 ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                              <Check size={14} /> Cocok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                              <AlertTriangle size={14} /> Selisih
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Catatan & Tombol */}
              <div className="bg-gray-50 border-t border-gray-200 p-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan Audit</label>
                  <textarea
                    value={so.notes}
                    onChange={(e) => setStockOpnameList(stockOpnameList.map(item => item.id === so.id ? { ...item, notes: e.target.value } : item))}
                    placeholder="Misal: Biji kopi tumpah 100 gram saat shift pagi..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none resize-none text-gray-700"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleSaveToDatabase(so)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    <Save size={18} /> Simpan ke Database
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State untuk Draft */}
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

      

      {/* Completed Opnames Section */}
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
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {completedOpnames.length} selesai
              </span>
            </div>
          </div>

          {completedOpnames.map((co) => (
            <div key={co.id} className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{co.id}</h3>
                    <p className="text-green-100 text-sm">
                      Tanggal Opname: {formatDate(co.date)}
                      {co.completedAt && ` • Disimpan: ${formatDate(new Date(co.completedAt))}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-100">Nilai Aset</p>
                    <p className="text-2xl font-bold">{formatCurrency(co.totalValue)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {co.products.length} item •{' '}
                    <span className={co.products.some(p => p.difference !== 0) ? 'text-yellow-600 font-semibold' : 'text-green-600'}>
                      {co.products.some(p => p.difference !== 0) ? 'Ada Selisih' : 'Semua Cocok'}
                    </span>
                  </p>
                  {co.notes && <p className="text-sm text-gray-500 mt-1">Catatan: {co.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setExpandedDetail(expandedDetail === co.id ? null : co.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors"
                  >
                    <Eye size={14} /> Detail
                  </button>
                  <button
                    onClick={() => handleClearCompleted(co.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded transition-colors"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>

              {/* Expandable Detail */}
              {expandedDetail === co.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left font-semibold text-gray-700 pb-2">Bahan</th>
                        <th className="text-center font-semibold text-gray-700 pb-2">Sistem</th>
                        <th className="text-center font-semibold text-gray-700 pb-2">Fisik</th>
                        <th className="text-center font-semibold text-gray-700 pb-2">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {co.products && co.products.length > 0 ? (
                        co.products.map((item) => (
                          <tr key={item.ingredientId} className="border-b border-gray-200">
                            <td className="py-2 text-gray-800 font-semibold">{item.ingredientName || 'Tidak ada nama'}</td>
                            <td className="text-center text-gray-700">{item.systemStock} {item.unit}</td>
                            <td className="text-center text-gray-700">{item.physicalStock} {item.unit}</td>
                            <td className={`text-center font-semibold ${item.difference === 0 ? 'text-gray-700' : item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-gray-500 text-sm">
                            Tidak ada data item tersedia
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}