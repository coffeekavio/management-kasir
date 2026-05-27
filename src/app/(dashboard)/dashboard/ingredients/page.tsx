'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Save, X, Edit2, Trash2 } from 'lucide-react';
import { Ingredient } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ingredientService } from '@/services/ingredientService';
import { useAuthStore } from '@/lib/store';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    unit: 'gram',
    cost: '',
  });

  const fetchIngredients = useCallback(async () => {
    setIsLoading(true);
    try {
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

  const columns = useMemo<MRT_ColumnDef<Ingredient>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama Bahan',
        size: 200,
      },
      {
        accessorKey: 'stock',
        header: 'Sisa Stok',
        size: 120,
      },
      {
        accessorKey: 'unit',
        header: 'Satuan',
        size: 100,
      },
      {
        accessorKey: 'cost',
        header: 'Harga per Satuan',
        size: 150,
        Cell: ({ cell }) => formatCurrency(cell.getValue<number>() || 0),
      },
      {
        id: 'actions',
        header: 'Aksi',
        size: 120,
        Cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleOpenEditModal(row.original)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: ingredients,
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
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        '&:hover': {
          backgroundColor: '#f0f4f8',
        },
        borderBottom: '1px solid #f3f4f6',
      },
    }),
    muiSearchTextFieldProps: {
      placeholder: 'Cari nama bahan baku...',
      variant: 'outlined',
      size: 'small',
      fullWidth: false,
    },
  });

  useEffect(() => {
    if (activeCafeId) {
      fetchIngredients();
    }
  }, [activeCafeId, fetchIngredients]);

  const handleOpenAddModal = () => {
    setEditingIngredient(null);
    setFormData({ name: '', stock: '', unit: 'gram', cost: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      stock: ingredient.stock.toString(),  // ← Ubah ke string
      unit: ingredient.unit,
      cost: ingredient.cost?.toString() || '',  // ← Ubah ke string
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (!activeCafeId) {
      alert('Error: Silakan pilih cafe terlebih dahulu dari dropdown di navbar');
      return;
    }

    try {
      const payload = {
        cafe_id: activeCafeId,
        name: formData.name,
        stock: parseFloat(formData.stock) || 0,  // ← Konversi di sini
        unit: formData.unit,
        cost: parseInt(formData.cost) || 0,  // ← Konversi di sini
      };

      if (editingIngredient) {
        await ingredientService.updateIngredient(editingIngredient.id, payload);
      } else {
        await ingredientService.createIngredient(payload);
      }
      
      setIsModalOpen(false);
      setFormData({ name: '', stock: '', unit: 'gram', cost: '' });
      fetchIngredients();
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
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

const handleDelete = async (id: string) => {
  if (
    confirm(
      'Apakah Anda yakin ingin menghapus bahan baku ini? Menghapus bahan baku dapat memengaruhi menu jualan yang terikat dengan resep ini.'
    )
  ) {
    try {
      await ingredientService.deleteIngredient(id);
      fetchIngredients(); // ← Fetch data terbaru dari server
    } catch (error) {
      console.error('Gagal menghapus data:', error);
      alert('Gagal menghapus data dari server.');
    }
  }
};

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Master Bahan Baku</h1>
          <p className="text-gray-600 mt-1">Daftar stok induk komoditas gudang dapur kafe</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors w-fit"
        >
          <Plus size={20} />
          Tambah Bahan Baku
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <MaterialReactTable table={table} />
      </div>

      {/* Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#2563eb', color: 'white' }}>
          {editingIngredient ? 'Ubah Informasi Bahan Baku' : 'Tambah Master Bahan Baku Baru'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              fullWidth
              label="Nama Bahan Baku"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Susu UHT Fullcream Diamond"
              variant="outlined"
              required
              size="small"
              margin="normal"
            />

            <div className="grid grid-cols-2 gap-4">
              <TextField
                fullWidth
                label="Stok Awal"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                variant="outlined"
                required
                size="small"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Satuan Ukur</InputLabel>
                <Select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  label="Satuan Ukur"
                >
                  <MenuItem value="gram">gram</MenuItem>
                  <MenuItem value="ml">ml (Mililiter)</MenuItem>
                  <MenuItem value="pcs">pcs (Satuan)</MenuItem>
                  <MenuItem value="kg">kg (Kilogram)</MenuItem>
                  <MenuItem value="liter">liter</MenuItem>
                </Select>
              </FormControl>
            </div>

            <TextField
              fullWidth
              label="Harga Pokok Beli (Per Satuan)"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="Harga kulakan awal"
              variant="outlined"
              required
              size="small"
              margin="normal"
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsModalOpen(false)} variant="outlined">
            Batal
          </Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#2563eb', color: 'white' }}>
            <Save size={16} className="mr-2" />
            Simpan Bahan
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
