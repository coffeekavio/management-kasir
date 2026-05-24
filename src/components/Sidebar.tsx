'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, ShoppingCart, Users, Package, LogOut, Menu, X, Coffee } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/transactions', icon: ShoppingCart, label: 'Transaksi' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analitik' },
    { href: '/dashboard/cashiers', icon: Users, label: 'Manajemen Kasir' },
    { href: '/dashboard/stock-opname', icon: Package, label: 'Stok Opname' },
    { href: '/dashboard/ingredients', icon: Coffee, label: 'Bahan Baku' },
    { href: '/dashboard/menus', icon: Package, label: 'Menu Jualan' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-gray-800 text-white rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white p-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative z-40`}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-blue-400">Manager Kasir</h1>
          <p className="text-sm text-gray-400 mt-1">Sistem Manajemen Penjualan</p>
        </div>

        <nav className="space-y-2 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
