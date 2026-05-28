'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Save, Trash2 } from 'lucide-react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Switch, TextField } from '@mui/material';
import { useAuthStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { useCrudAlert } from '@/hooks/useAlert';
import { modalError as showModalError } from '@/components/Modals';
import { voucherService } from '@/services/voucherService';
import type { Voucher, VoucherCreatePayload } from '@/types';

const formatDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const toDateTimeLocal = (value?: string | Date) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

export default function VouchersPage() {
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const alert = useCrudAlert();

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    discount_percentage: '10',
    min_purchase: '0',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const resetForm = useCallback(() => {
    setEditingVoucher(null);
    setFormData({
      name: '',
      discount_percentage: '10',
      min_purchase: '0',
      start_date: '',
      end_date: '',
      is_active: true,
    });
  }, []);

  const fetchVouchers = useCallback(async () => {
    if (!activeCafeId) {
      setVouchers([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await voucherService.getVouchersByCafe(activeCafeId);
      setVouchers(data);
    } catch (error) {
      console.error('Gagal memuat data voucher:', error);
      await showModalError('Gagal Memuat Voucher', 'Tidak dapat mengambil data voucher dari server.');
    } finally {
      setIsLoading(false);
    }
  }, [activeCafeId]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setIsModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      name: voucher.name,
      discount_percentage: String(voucher.discount_percentage),
      min_purchase: String(voucher.min_purchase),
      start_date: toDateTimeLocal(voucher.start_date),
      end_date: toDateTimeLocal(voucher.end_date),
      is_active: voucher.is_active,
    });
    setIsModalOpen(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!activeCafeId) {
      alert.error('Cafe Belum Dipilih', 'Silakan pilih cafe terlebih dahulu dari navbar.');
      return;
    }

    if (!formData.name.trim() || !formData.start_date || !formData.end_date) {
      alert.error('Data Belum Lengkap', 'Nama, tanggal mulai, dan tanggal berakhir wajib diisi.');
      return;
    }

    const payload: VoucherCreatePayload = {
      cafe_id: activeCafeId,
      name: formData.name,
      discount_percentage: parseInt(formData.discount_percentage, 10) || 0,
      min_purchase: parseInt(formData.min_purchase, 10) || 0,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: formData.is_active,
    };

    try {
      alert.loading('Sedang menyimpan voucher...');

      if (editingVoucher) {
        await voucherService.updateVoucher(editingVoucher.id, {
          name: payload.name,
          discount_percentage: payload.discount_percentage,
          min_purchase: payload.min_purchase,
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_active: payload.is_active,
        });
        alert.successAfterLoading('Voucher berhasil diperbarui!');
      } else {
        await voucherService.createVoucher(payload);
        alert.successAfterLoading('Voucher berhasil ditambahkan!');
      }

      setIsModalOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error) {
      console.error('Gagal menyimpan voucher:', error);
      const message = error instanceof Error ? error.message : 'Gagal menyimpan voucher.';
      alert.error('Gagal Menyimpan Voucher', message);
    }
  };

  const handleDelete = useCallback(async (voucher: Voucher) => {
    const confirmed = await alert.confirmDelete(
      'Voucher ini',
      'Voucher yang dihapus tidak bisa dipakai lagi oleh kasir.'
    );

    if (!confirmed) return;

    try {
      alert.loading('Sedang menghapus voucher...');
      await voucherService.deleteVoucher(voucher.id);
      alert.successAfterLoading('Voucher berhasil dihapus!');
      fetchVouchers();
    } catch (error) {
      console.error('Gagal menghapus voucher:', error);
      alert.error('Gagal Menghapus Voucher', 'Terjadi masalah saat menghapus voucher.');
    }
  }, [alert, fetchVouchers]);

  const columns = useMemo<MRT_ColumnDef<Voucher>[]>(
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
        header: 'Nama Promo',
        size: 180,
      },
      {
        accessorKey: 'discount_percentage',
        header: 'Diskon',
        size: 100,
        Cell: ({ cell }) => `${cell.getValue<number>() || 0}%`,
      },
      {
        accessorKey: 'min_purchase',
        header: 'Min. Belanja',
        size: 140,
        Cell: ({ cell }) => formatCurrency(cell.getValue<number>() || 0),
      },
      {
        id: 'periode',
        header: 'Periode',
        size: 240,
        Cell: ({ row }) => `${formatDateTime(row.original.start_date)} - ${formatDateTime(row.original.end_date)}`,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cell.getValue<boolean>() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {cell.getValue<boolean>() ? 'Aktif' : 'Nonaktif'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        size: 120,
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => openEditModal(row.original)}
              className="rounded p-1.5 text-blue-600 transition-colors hover:bg-blue-50"
              title="Edit"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="rounded p-1.5 text-red-600 transition-colors hover:bg-red-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, openEditModal]
  );

  const table = useMaterialReactTable({
    columns,
    data: vouchers,
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
    muiTableBodyRowProps: () => ({
      sx: {
        '&:hover': {
          backgroundColor: '#f0f4f8',
        },
        borderBottom: '1px solid #f3f4f6',
      },
    }),
    muiSearchTextFieldProps: {
      placeholder: 'Cari promo atau voucher...',
      variant: 'outlined',
      size: 'small',
      fullWidth: false,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Manajemen Voucher Diskon</h1>
          <p className="mt-1 text-gray-600">Kelola promo aktif, periode berlaku, dan nilai minimal pembelian.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:px-4 sm:py-2 sm:text-base"
        >
          <Plus size={20} />
          Tambah Voucher
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-md">
        <div className="min-w-full">
          <MaterialReactTable table={table} />
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#2563eb', color: 'white' }}>
          {editingVoucher ? 'Ubah Voucher Diskon' : 'Tambah Voucher Diskon Baru'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 1.5 }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextField
              fullWidth
              label="Nama Promo"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder="Contoh: Promo Kemerdekaan"
              variant="outlined"
              required
              size="small"
              margin="normal"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Diskon (%)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.discount_percentage}
                  onChange={(event) => setFormData({ ...formData, discount_percentage: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Minimal Belanja</label>
                <input
                  type="number"
                  min={0}
                  value={formData.min_purchase}
                  onChange={(event) => setFormData({ ...formData, min_purchase: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(event) => setFormData({ ...formData, start_date: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Tanggal Berakhir</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(event) => setFormData({ ...formData, end_date: event.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                />
              }
              label={formData.is_active ? 'Voucher aktif' : 'Voucher nonaktif'}
            />
          </form>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsModalOpen(false)} variant="outlined">
            Batal
          </Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#2563eb', color: 'white' }}>
            <Save size={16} className="mr-2" />
            Simpan Voucher
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}