'use client';

import { StatCard } from '@/components/StatCard';
import { DollarSign, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { mockChartData, mockProducts, mockTransactions } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function DashboardPage() {
  // Calculate statistics
  const totalRevenue = mockTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalTransactions = mockTransactions.length;
  const totalProducts = mockProducts.length;
  const lowStockItems = mockProducts.filter((p) => p.stock < 10).length;

  // Data for pie chart (Payment Methods)
  const paymentMethodsData = [
    { name: 'Tunai', value: mockTransactions.filter((t) => t.paymentMethod === 'cash').length },
    { name: 'Kartu', value: mockTransactions.filter((t) => t.paymentMethod === 'card').length },
    { name: 'Digital', value: mockTransactions.filter((t) => t.paymentMethod === 'digital').length },
  ];

  // Data for low stock products
  const lowStockData = mockProducts
    .filter((p) => p.stock < 20)
    .map((p) => ({
      name: p.name.substring(0, 15) + (p.name.length > 15 ? '...' : ''),
      stock: p.stock,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Ringkasan data penjualan dan manajemen</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pendapatan"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={32} />}
          change={12}
          trend="up"
        />
        <StatCard
          title="Total Transaksi"
          value={totalTransactions}
          icon={<ShoppingCart size={32} />}
          change={8}
          trend="up"
        />
        <StatCard
          title="Total Produk"
          value={totalProducts}
          icon={<Package size={32} />}
          change={0}
          trend="up"
        />
        <StatCard
          title="Stok Rendah"
          value={lowStockItems}
          icon={<AlertCircle size={32} />}
          change={2}
          trend="down"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Grafik Pendapatan</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Pendapatan"
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Metode Pembayaran</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Tren Transaksi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#10B981" name="Jumlah Transaksi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Produk Stok Rendah</h2>
          {lowStockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={lowStockData}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={95} />
                <Tooltip />
                <Bar dataKey="stock" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-500">
              Tidak ada produk dengan stok rendah
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Transaksi Terbaru</h2>
          <a
            href="/dashboard/transactions"
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
          >
            Lihat Semua →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">ID</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Tanggal</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Kasir</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Metode</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.slice(0, 5).map((txn) => (
                <tr key={txn.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{txn.id}</td>
                  <td className="px-4 py-2 text-gray-800">
                    {txn.date.toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-gray-800">{txn.cashierName}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold capitalize">
                      {txn.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-800 font-semibold">
                    {formatCurrency(txn.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
