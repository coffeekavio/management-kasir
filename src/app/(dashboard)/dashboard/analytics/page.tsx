'use client';

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
import { mockChartData, mockTransactions, mockProducts } from '@/lib/mockData';
import { formatCurrency, calculateHPP } from '@/lib/utils';
import { TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AnalyticsPage() {
  // Calculate metrics
  const totalRevenue = mockTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalHPP = calculateHPP(mockTransactions);
  const grossProfit = totalRevenue - totalHPP;
  const profitMargin = ((grossProfit / totalRevenue) * 100).toFixed(2);

  // Sales by product
  const productSales = mockProducts.map((product) => ({
    name: product.name.substring(0, 12) + (product.name.length > 12 ? '...' : ''),
    sales: Math.floor(Math.random() * 100) * 1000,
    cost: product.cost,
  }));

  // Revenue breakdown by cashier
  const revenueByCashier = mockTransactions.reduce(
    (acc, txn) => {
      const existing = acc.find((item) => item.name === txn.cashierName);
      if (existing) {
        existing.value += txn.amount;
        existing.count += 1;
      } else {
        acc.push({
          name: txn.cashierName,
          value: txn.amount,
          count: 1,
        });
      }
      return acc;
    },
    [] as Array<{ name: string; value: number; count: number }>
  );

  // Payment method statistics
  const paymentStats = [
    {
      name: 'Tunai',
      value: mockTransactions
        .filter((t) => t.paymentMethod === 'cash')
        .reduce((sum, t) => sum + t.amount, 0),
      count: mockTransactions.filter((t) => t.paymentMethod === 'cash').length,
    },
    {
      name: 'Kartu',
      value: mockTransactions
        .filter((t) => t.paymentMethod === 'card')
        .reduce((sum, t) => sum + t.amount, 0),
      count: mockTransactions.filter((t) => t.paymentMethod === 'card').length,
    },
    {
      name: 'Digital',
      value: mockTransactions
        .filter((t) => t.paymentMethod === 'digital')
        .reduce((sum, t) => sum + t.amount, 0),
      count: mockTransactions.filter((t) => t.paymentMethod === 'digital').length,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Analitik & Laporan</h1>
        <p className="text-gray-600 mt-1">Insight mendalam tentang performa penjualan</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-blue-100 text-sm font-semibold">Total Pendapatan</p>
            <DollarSign size={24} className="opacity-50" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-blue-100 text-sm mt-2">↑ 12% dari minggu lalu</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-green-100 text-sm font-semibold">Laba Kotor</p>
            <TrendingUp size={24} className="opacity-50" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(grossProfit)}</p>
          <p className="text-green-100 text-sm mt-2">
            {profitMargin}% dari pendapatan
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-orange-100 text-sm font-semibold">HPP</p>
            <ShoppingCart size={24} className="opacity-50" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalHPP)}</p>
          <p className="text-orange-100 text-sm mt-2">
            {((totalHPP / totalRevenue) * 100).toFixed(2)}% dari pendapatan
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-purple-100 text-sm font-semibold">Margin Keuntungan</p>
            <Percent size={24} className="opacity-50" />
          </div>
          <p className="text-3xl font-bold">{profitMargin}%</p>
          <p className="text-purple-100 text-sm mt-2">Margin keuntungan bersih</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Tren Pendapatan</h2>
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

        {/* Revenue by Cashier */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Pendapatan per Kasir</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByCashier}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="value" fill="#10B981" name="Pendapatan" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Distribusi Metode Pembayaran</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Product Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Performa Produk</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={productSales}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={95} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Bar dataKey="sales" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods Statistics Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800">Statistik Metode Pembayaran</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Metode</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Jumlah Transaksi</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Total Nominal</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Rata-rata</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {paymentStats.map((stat, idx) => (
                <tr
                  key={stat.name}
                  className={`border-b border-gray-200 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-800">{stat.name}</td>
                  <td className="px-6 py-4 text-right text-gray-800">{stat.count}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {formatCurrency(stat.value)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {formatCurrency(stat.value / stat.count)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {((stat.value / totalRevenue) * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Cashier Detail */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-800">Performa Kasir</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Nama Kasir</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Jumlah Transaksi</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Total Penjualan</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Rata-rata</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {revenueByCashier.map((cashier, idx) => (
                <tr
                  key={cashier.name}
                  className={`border-b border-gray-200 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-gray-800">{cashier.name}</td>
                  <td className="px-6 py-4 text-right text-gray-800">{cashier.count}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {formatCurrency(cashier.value)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {formatCurrency(cashier.value / cashier.count)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {((cashier.value / totalRevenue) * 100).toFixed(2)}%
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
