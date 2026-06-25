'use client';

import { useState, useEffect,useMemo } from 'react';
import { FileText, Filter, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { formatCurrency, formatDate, exportToExcel, exportToPDF } from '@/lib/utils';
import { getTransactions, getTransactionDetail, deleteTransaction, updateTransaction } from '@/services/transactions';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { alertSuccess, alertError, alertConfirm, alertInfo } from '@/lib/alertUtils';

interface TransactionList {
  id: string;
  receipt_number: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  cashier_name: string;
}

export default function TransactionsPage() {
  // State untuk list transaksi
  const [transactions, setTransactions] = useState<TransactionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk filter & search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterCashierName, setFilterCashierName] = useState<string>('all');

  // State untuk modal
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // State untuk modal edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch data transaksi saat mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengambil data transaksi';
      setError(errorMsg);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle lihat detail
  const handleViewDetail = async (transactionId: string) => {
    try {
      const detail = await getTransactionDetail(transactionId);
      setSelectedTransaction(detail);
      setShowDetailModal(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengambil detail transaksi';
      await alertError('Error', errorMsg);
    }
  };

  // Handle hapus transaksi
  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      setTransactions(transactions.filter(t => t.id !== transactionToDelete));
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      await alertSuccess('Berhasil', 'Transaksi berhasil dihapus');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus transaksi';
      await alertError('Error', errorMsg);
    }
  };

  // Handle edit transaksi
  const handleEditTransaction = async (transactionId: string) => {
    try {
      const detail = await getTransactionDetail(transactionId);
      setTransactionToEdit(detail);
      setShowEditModal(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengambil detail transaksi';
      await alertError('Error', errorMsg);
    }
  };

  const handleSaveEdit = async (updatedData: any) => {
    if (!transactionToEdit) return;
    try {
      setEditLoading(true);
      await updateTransaction(transactionToEdit.id, updatedData);
      
      // Update list transaksi
      await fetchTransactions();
      
      setShowEditModal(false);
      setTransactionToEdit(null);
      await alertSuccess('Berhasil', 'Transaksi berhasil diupdate');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengupdate transaksi';
      await alertError('Error', errorMsg);
    } finally {
      setEditLoading(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<TransactionList>[]>(
    () => [
      {
        accessorKey: 'receipt_number',
        header: 'No Resit',
      },
      {
        accessorKey: 'created_at',
        header: 'Tanggal',
        Cell: ({ cell }) => {
        const date = new Date(cell.getValue<string>());
        return date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },  
      },
      {
        accessorKey: 'payment_method',
        header: 'Metode Pembayaran',
        Cell: ({ cell }) => formatPaymentMethod(cell.getValue<string>()),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        Cell: ({ cell }) => (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
            cell.getValue<string>() === 'completed'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {cell.getValue<string>()}
        </span>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Jumlah',
        Cell: ({ cell }) => (
          <span className="font-semibold">
            {formatCurrency(cell.getValue<number>() ?? 0)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleViewDetail(row.original.id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
            >
              <Eye size={18} />
              Detail
            </button>
            <button
              onClick={() => handleEditTransaction(row.original.id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
            >
              <Edit2 size={18} />
              Edit
            </button>
            <button
              onClick={() => {
                setTransactionToDelete(row.original.id);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              <Trash2 size={18} />
              Hapus
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchesSearch =
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.receipt_number.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterPaymentMethod === 'all' || txn.payment_method === filterPaymentMethod;

      const matchesCashier =
        filterCashierName === 'all' || txn.cashier_name === filterCashierName;

      return matchesSearch && matchesFilter && matchesCashier;
    });
  }, [transactions, searchTerm, filterPaymentMethod, filterCashierName]);

  const formatPaymentMethod = (method: string) => {
    if (method === 'cash') return 'Tunai';
    if (method === 'qris_static') return 'QRIS';
    if (method === 'card') return 'Kartu';
    return method;
  };

  const cashierOptions = useMemo(() => {
    const names = transactions.map((txn) => txn.cashier_name || 'Tidak Diketahui');
    return ['all', ...Array.from(new Set(names))];
  }, [transactions]);

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredTransactions.map((txn) => ({
      'ID Transaksi': txn.id,
      'No Resit': txn.receipt_number,
      'Tanggal': formatDate(new Date(txn.created_at)),
      'Metode Pembayaran': txn.payment_method,
      'Status': txn.status,
      'Jumlah': txn.total_amount,
    }));
    exportToExcel(data, `Transaksi_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const data = filteredTransactions.map((txn) => ({
      id: txn.id,
      receipt_number: txn.receipt_number,
      date: formatDate(new Date(txn.created_at)),
      payment_method: txn.payment_method,
      status: txn.status,
      amount: txn.total_amount,
    }));
    exportToPDF(
      data,
      `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}`,
      ['id', 'receipt_number', 'date', 'payment_method', 'status', 'amount']
    );
  };

  const table = useMaterialReactTable({
    columns,
    data: filteredTransactions,
    state: {
      isLoading: loading,
    },
    enablePagination: true,
    enableSorting: true,
    enableColumnFilters: true,
    enableColumnFilterModes: true,
    enableGlobalFilter: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    muiSearchTextFieldProps: {
      placeholder: 'Cari ID atau No Resit...',
      variant: 'outlined',
      size: 'small',
      fullWidth: false,
    },
    muiTableBodyCellProps: {
      sx: {
        padding: '12px 16px',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Data Transaksi</h1>
        <p className="text-gray-600 mt-1">Kelola dan lihat semua transaksi penjualan</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={fetchTransactions}
            className="ml-2 underline font-semibold hover:text-red-900"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-3 text-gray-400" />
            <select
              value={filterCashierName}
              onChange={(e) => setFilterCashierName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-600"
            >
              <option value="all">Semua Shift / Kasir</option>
              {cashierOptions.filter((name) => name !== 'all').map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-3 text-gray-400" />
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-gray-400"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Tunai</option>
              <option value="qris_static">QRIS</option>
              <option value="card">Kartu</option>
            </select>
          </div>

          {/* Export Section */}
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <FileText size={20} />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <FileText size={20} />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Results info */}
        <p className="text-sm text-gray-600">
          Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data transaksi...</p>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
          <MaterialReactTable table={table} />
        </div>
      )}

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Total Pendapatan</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(
                filteredTransactions.reduce((sum, txn) => sum + txn.total_amount, 0)
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm mb-2">Rata-rata Transaksi</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(
                filteredTransactions.length > 0
                  ? filteredTransactions.reduce((sum, txn) => sum + txn.total_amount, 0) /
                      filteredTransactions.length
                  : 0
              )}
            </p>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <DetailModal
          transaction={selectedTransaction}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          onConfirm={handleDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setTransactionToDelete(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && transactionToEdit && (
        <EditModal
          transaction={transactionToEdit}
          onSave={handleSaveEdit}
          onClose={() => {
            setShowEditModal(false);
            setTransactionToEdit(null);
          }}
          loading={editLoading}
        />
      )}
    </div>
  );
}

function DetailModal({
  transaction,
  onClose,
}: {
  transaction: any;
  onClose: () => void;
}) {
  const formatPaymentMethod = (method: string) => {
    if (method === 'cash') return 'Tunai';
    if (method === 'qris_static') return 'QRIS';
    if (method === 'card') return 'Kartu';
    return method;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail Transaksi</h2>
            <p className="text-sm text-gray-600">No Resit {transaction.receipt_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Tanggal</p>
              <p className="font-semibold text-gray-900">{formatDate(new Date(transaction.created_at))}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Metode Pembayaran</p>
              <p className="font-semibold text-gray-900">{formatPaymentMethod(transaction.payment_method)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold text-gray-900 capitalize">{transaction.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kasir</p>
              <p className="font-semibold text-gray-900">{transaction.cashier_name ?? '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member</p>
              <p className="font-semibold text-gray-900">{transaction.member_id ?? 'Tidak ada'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Voucher</p>
              <p className="font-semibold text-gray-900">{transaction.voucher_id ?? 'Tidak ada'}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 border">
              <p className="text-sm text-gray-500">Subtotal</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrency(transaction.subtotal)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border">
              <p className="text-sm text-gray-500">Diskon</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatCurrency(transaction.discount_amount + transaction.voucher_discount_amount)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 border">
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-2 text-lg font-semibold text-green-600">{formatCurrency(transaction.total_amount)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              <div>Nama Menu</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Harga</div>
              <div className="text-right">Subtotal</div>
            </div>

            <div className="divide-y divide-gray-200 bg-white">
              {transaction.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-4 py-3 text-sm text-gray-700"
                >
                  <div>{item.menu_name ?? item.menu_id}</div>
                  <div className="text-right">{item.quantity}</div>
                  <div className="text-right">{formatCurrency(item.price)}</div>
                  <div className="text-right">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}

              {transaction.items.length === 0 && (
                <div className="px-4 py-5 text-sm text-gray-500">
                  Tidak ada item transaksi.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Hapus Transaksi?</h2>
          <p className="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditModal({
  transaction,
  onSave,
  onClose,
  loading,
}: {
  transaction: any;
  onSave: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    discount_amount: transaction.discount_amount || 0,
    voucher_discount_amount: transaction.voucher_discount_amount || 0,
    payment_method: transaction.payment_method || 'cash',
    amount_tendered: transaction.amount_tendered || 0,
    status: transaction.status || 'completed',
    total_amount: transaction.total_amount || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' || name === 'payment_method' ? value : parseInt(value) || 0,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Hitung total baru
  const newTotal = Math.max(
    0,
    transaction.subtotal - formData.discount_amount - formData.voucher_discount_amount
  );
  const changeAmount =
    formData.payment_method.toLowerCase() === 'cash'
      ? Math.max(0, formData.amount_tendered - newTotal)
      : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Edit Transaksi</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          {/* Discount Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Diskon Transaksi
            </label>
            <input
              type="number"
              name="discount_amount"
              value={formData.discount_amount}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            />
          </div>

          {/* Voucher Discount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Diskon Voucher
            </label>
            <input
              type="number"
              name="voucher_discount_amount"
              value={formData.voucher_discount_amount}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Total</label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Metode Pembayaran
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="cash">Tunai</option>
              <option value="qris_static">QRIS</option>
              <option value="card">Kartu</option>
            </select>
          </div>

          {/* Amount Tendered */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Jumlah Dibayar
            </label>
            <input
              type="number"
              name="amount_tendered"
              value={formData.amount_tendered}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-black"
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Summary Info */}
          <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-600">{formatCurrency(transaction.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Diskon:</span>
                <span className="font-semibold text-gray-600">
                  -{formatCurrency(formData.discount_amount + formData.voucher_discount_amount)}
                </span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold">
                <span className='text-black'>Total Baru:</span>
                <span className="text-green-600">{formatCurrency(newTotal)}</span>
              </div>
              {formData.payment_method.toLowerCase() === 'cash' && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Kembalian:</span>
                  <span>{formatCurrency(changeAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
