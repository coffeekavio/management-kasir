'use client';

import { useState } from 'react';
import { FileText, Filter, Search } from 'lucide-react';
import { mockTransactions } from '@/lib/mockData';
import { formatCurrency, formatDate, exportToExcel, exportToPDF } from '@/lib/utils';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Filter transactions
  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchesSearch =
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.cashierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterPaymentMethod === 'all' || txn.paymentMethod === filterPaymentMethod;

    return matchesSearch && matchesFilter;
  });

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredTransactions.map((txn) => ({
      'ID Transaksi': txn.id,
      Tanggal: formatDate(txn.date),
      Kasir: txn.cashierName,
      'Metode Pembayaran': txn.paymentMethod,
      Jumlah: formatCurrency(txn.amount),
    }));
    exportToExcel(data, `Transaksi_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const data = filteredTransactions.map((txn) => ({
      id: txn.id,
      date: formatDate(txn.date),
      cashierName: txn.cashierName,
      paymentMethod: txn.paymentMethod,
      amount: txn.amount,
    }));
    exportToPDF(
      data,
      `Laporan_Transaksi_${new Date().toISOString().split('T')[0]}`,
      ['id', 'date', 'cashierName', 'paymentMethod', 'amount']
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Data Transaksi</h1>
        <p className="text-gray-600 mt-1">Kelola dan lihat semua transaksi penjualan</p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Cari ID atau Kasir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-3 text-gray-400" />
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
            >
              <option value="all">Semua Metode</option>
              <option value="cash">Tunai</option>
              <option value="card">Kartu</option>
              <option value="digital">Digital</option>
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
          Menampilkan {filteredTransactions.length} dari {mockTransactions.length} transaksi
        </p>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">ID Transaksi</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Kasir</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Metode Pembayaran</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Produk</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Jumlah</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((txn, idx) => (
                <tr
                  key={txn.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-800">{txn.id}</td>
                  <td className="px-6 py-4 text-gray-700">{formatDate(txn.date)}</td>
                  <td className="px-6 py-4 text-gray-700">{txn.cashierName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        txn.paymentMethod === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : txn.paymentMethod === 'card'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {txn.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {txn.items.map((item) => item.productName).join(', ')}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Tidak ada transaksi yang sesuai dengan filter
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-800">{filteredTransactions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Total Pendapatan</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(
              filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">Rata-rata Transaksi</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(
              filteredTransactions.length > 0
                ? filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0) /
                    filteredTransactions.length
                : 0
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
