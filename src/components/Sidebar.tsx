'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, ShoppingCart, Users, Package, LogOut, Menu, X, Coffee, Gift, BadgePercent } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Image from 'next/image';
import logo_white from '../app/assets/logo-white.png';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/transactions', icon: ShoppingCart, label: 'Transaksi' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analitik' },
    { href: '/dashboard/cashiers', icon: Users, label: 'Manajemen Karyawan' },
    { href: '/dashboard/members', icon: Gift, label: 'Member & Reward' },
    { href: '/dashboard/stock-opname', icon: Package, label: 'Stok Opname' },
    { href: '/dashboard/vouchers', icon: BadgePercent, label: 'Voucher Diskon' },
    { href: '/dashboard/ingredients', icon: Coffee, label: 'Bahan Baku' },
    { href: '/dashboard/menus', icon: Package, label: 'Menu Jualan' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-[#1976D2] text-white rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0D47A1] to-[#1565C0] text-white p-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative z-40 shadow-lg flex flex-col`}
      >
        <div className="mb-8 md:mb-14 flex flex-col items-center gap-3">
          <Image src={logo_white} alt="Velo logo" className="w-28 h-auto object-contain"/>
          <div>
            <p className="text-sm text-[#E3F2FD]">Sistem Manajemen Penjualan</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-1 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-[#1976D2] text-white border-l-4 border-[#1E88E5]'
                    : 'text-[#E3F2FD] hover:bg-[#42A5F5]/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 md:mt-auto">
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#E3F2FD] hover:bg-[#42A5F5]/10 hover:text-white transition-colors w-full"
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
