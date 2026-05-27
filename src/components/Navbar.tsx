'use client';

import { useAuthStore } from '@/lib/store';
import { Bell, Settings, User, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const cafeList = useAuthStore((state) => state.cafeList);
  const setActiveCafeId = useAuthStore((state) => state.setActiveCafeId);
  const setCafeList = useAuthStore((state) => state.setCafeList);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCafeMenu, setShowCafeMenu] = useState(false);
  const [loadingCafes, setLoadingCafes] = useState(true);

  const activeCafe = cafeList.find(c => c.id === activeCafeId) || cafeList[0];

  // Fetch daftar kafe milik manager saat component mount
  useEffect(() => {
    const fetchManagerCafes = async () => {
      if (!user?.id) return;
      try {
        setLoadingCafes(true);
        
        // MENGGUNAKAN AXIOS: Otomatis memakai URL VPS dari .env.local
        // dan otomatis menyertakan Token (jika diperlukan)
        const response = await api.get(`/api/cafes?manager_id=${user.id}`);
        const data = response.data; // Axios otomatis mengubah response ke JSON
        
        if (data.status === 'success' && data.data) {
          setCafeList(data.data);
          // Set activeCafeId ke kafe pertama jika belum ada
          if (data.data.length > 0 && !activeCafeId) {
            setActiveCafeId(data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Gagal fetch daftar kafe:', err);
      } finally {
        setLoadingCafes(false);
      }
    };
    
    fetchManagerCafes();
  }, [user?.id, activeCafeId]);

  return (
    <nav className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h2 className="hidden md:flex text-base sm:text-xl font-bold text-gray-800 truncate">
          Selamat datang, {user?.name}
        </h2>
        
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        {/* Dropdown Pilih Cabang - Hanya tampil jika ada lebih dari 1 kafe */}
        {cafeList.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowCafeMenu(!showCafeMenu)}
              disabled={loadingCafes}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 text-gray-800 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              <span className="text-gray-600">📍</span>
              <span className="hidden sm:inline">{loadingCafes ? 'Loading...' : activeCafe?.name}</span>
              <span className="sm:hidden text-xs">{loadingCafes ? '...' : (activeCafe?.name?.split(' ')[0] || 'Kafe')}</span>
              {cafeList.length > 1 && <ChevronDown size={16} />}
            </button>

            {/* Dropdown menu - hanya tampil jika ada lebih dari 1 kafe */}
            {showCafeMenu && cafeList.length > 1 && (
              <div className="absolute top-full right-0 sm:left-0 mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Pilih Cabang ({cafeList.length})</p>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {cafeList.map((cafe) => (
                    <button
                      key={cafe.id}
                      onClick={() => {
                        setActiveCafeId(cafe.id);
                        setShowCafeMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded text-sm transition-colors ${
                        activeCafeId === cafe.id
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {activeCafeId === cafe.id ? '✓ ' : '  '}{cafe.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {/* <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={24} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button> */}

        {/* Settings */}
        {/* <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Settings size={24} />
        </button> */}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
          >
            <div className="w-10 h-10 bg-[#1976D2] rounded-full flex items-center justify-center text-white flex-shrink-0">
              <User size={20} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {/* <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Profil
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Pengaturan
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    useAuthStore.getState().logout();
                    window.location.href = '/login';
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Logout
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
