'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { Eye, EyeOff, Plus, Shield, ClipboardCheck, User, X, Edit2, Trash2 } from 'lucide-react';

interface Cashier {
  id: string;
  name: string;
  email: string;
  role: 'kasir' | 'supervisor' | 'manager';
  username: string;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  detail?: string;
}

export default function CashiersPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [pageError, setPageError] = useState(''); // Error untuk halaman utama
  const [modalError, setModalError] = useState(''); // Error untuk modal
  const [loading, setLoading] = useState(false);

  // State Kontrol Modal (Sesuai UI asli Anda)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // State Form Data untuk kebutuhan FastAPI Pydantic Model
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('kasir');

  // State List Karyawan (Diinisialisasi sebagai array kosong, murni menggunakan data asli dari API)
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const currentUser = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const cafeList = useAuthStore((state) => state.cafeList);

  const activeCafe = cafeList.find(c => c.id === activeCafeId);

  // 1. INTEGRASI GET: Memuat seluruh data karyawan dari server yang sesuai dengan cafe manager
  const fetchEmployees = useCallback(async () => {
    if (!activeCafeId) return; // Pastikan activeCafeId tersedia
    setPageLoading(true); // Reset loading saat cafe berubah
    try {
      const response = await fetch(`https://fastapi-kasir.vercel.app/api/users?cafe_id=${activeCafeId}`);
      const result: ApiResponse<{ id: string; full_name: string; email: string | null; role: string; username: string }[]> = await response.json();
      if (response.ok && result.status === 'success') {
        const mappedData: Cashier[] = result.data.map((emp) => ({
          id: emp.id,
          name: emp.full_name,
          email: emp.email || `${emp.username}@kasir.com`,
          role: emp.role as 'kasir' | 'supervisor' | 'manager',
          username: emp.username
        }));
        setCashiers(mappedData);
        setPageError(''); // Clear error jika berhasil
      } else {
        setPageError('Gagal memuat data karyawan');
        setCashiers([]);
      }
    } catch (err) {
      console.error('Gagal mengambil data dari server:', err);
      setPageError('Terjadi kesalahan saat memuat data karyawan');
      setCashiers([]);
    } finally {
      setPageLoading(false);
    }
  }, [activeCafeId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // Re-fetch ketika fetchEmployees berubah (yang terjadi saat activeCafeId berubah)

  // Buka Modal untuk Mode Tambah Staf Baru
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setRole('kasir');
    setModalError('');
    setIsModalOpen(true);
  };

  // Buka Modal untuk Mode Edit Staf
  const handleOpenEditModal = (cashier: Cashier) => {
    setIsEditMode(true);
    setEditingId(cashier.id);
    setEmail(cashier.email);
    setPassword(''); 
    setUsername(cashier.username);
    setFullName(cashier.name);
    setRole(cashier.role);
    setModalError('');
    setIsModalOpen(true);
  };

  // 2. INTEGRASI POST (Tambah) & PUT (Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setLoading(true);

    try {
      if (isEditMode && editingId) {
        // Logika UPDATE/EDIT data ke FastAPI
        const response = await fetch(`https://fastapi-kasir.vercel.app/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            full_name: fullName,
            role,
            ...(password ? { password } : {}) // Hanya kirim password jika diisi
          }),
        });

        const data: ApiResponse<unknown> = await response.json();
        if (!response.ok) throw new Error((data as { detail?: string }).detail || 'Gagal memperbarui data karyawan');

        if (data.status === 'success') {
          setCashiers(cashiers.map(c => c.id === editingId ? { ...c, name: fullName, email, role: role as 'kasir' | 'supervisor' | 'manager', username } : c));
          setIsModalOpen(false);
          setModalError('');
        }
      } else {
        // Logika INSERT/TAMBAH data baru ke FastAPI
        // Pastikan activeCafeId ada sebelum tambah
        if (!activeCafeId) {
          throw new Error('Silakan pilih cabang terlebih dahulu di navbar (refresh halaman jika belum ada)');
        }

        const response = await fetch('https://fastapi-kasir.vercel.app/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            username, 
            full_name: fullName, 
            role,
            cafe_id: activeCafeId // Gunakan activeCafeId dari dropdown cabang
          }),
        });

        const data: ApiResponse<{ user_id: string }> = await response.json();
        if (!response.ok) throw new Error((data as { detail?: string }).detail || 'Gagal mendaftarkan karyawan baru');

        if (data.status === 'success') {
          const newCashier: Cashier = {
            id: data.data.user_id,
            name: fullName,
            email: email,
            role: role as 'kasir' | 'supervisor' | 'manager',
            username: username,
          };
          setCashiers([...cashiers, newCashier]);
          setIsModalOpen(false);
          setModalError('');
        }
      }
    } catch (err) {
      const error = err as Error;
      setModalError(error.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  // 3. INTEGRASI DELETE: Menghapus akun karyawan
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus akun karyawan ini dari ' + activeCafe?.name + '?')) return;

    try {
      const response = await fetch(`https://fastapi-kasir.vercel.app/api/users/${id}`, {
        method: 'DELETE',
      });
      const data: ApiResponse<unknown> = await response.json();

      if (!response.ok) throw new Error((data as { detail?: string }).detail || 'Gagal menghapus karyawan');

      if (data.status === 'success') {
        setCashiers(cashiers.filter(cashier => cashier.id !== id));
        alert('Data karyawan berhasil dihapus dari ' + activeCafe?.name);
      }
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Gagal menghapus data');
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Karyawan</h1>
          <p className="text-gray-600">Kelola data kasir, supervisor, dan staf toko Anda</p>
          <p className="text-sm text-blue-600 font-medium mt-2">
            📍 Cabang: <span className="font-semibold">{activeCafe?.name || 'Memilih cabang...'}</span>
          </p>
        </div>
        {/* Validasi Akses: Hanya manager yang boleh menambah/mengelola staf */}
        {currentUser?.role === 'manager' && (
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={20} />
            Tambah Staf
          </button>
        )}
      </div>

      {currentUser?.role !== 'manager' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mb-6">
          *Anda login sebagai <strong>{currentUser?.role}</strong>. Akses manipulasi data (Tambah, Edit, Hapus) karyawan hanya diizinkan melalui akun ber-role <strong>manager</strong>.
        </div>
      )}

      {pageError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {pageError}
        </div>
      )}

      {/* Tampilan Tabel Utama */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
              <th className="p-4">Nama</th>
              <th className="p-4">Username</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              {currentUser?.role === 'manager' && <th className="p-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-600">
            {pageLoading ? (
              <tr>
                <td colSpan={currentUser?.role === 'manager' ? 5 : 4} className="p-4 text-center text-gray-400 animate-pulse">
                  Memuat data karyawan dari server...
                </td>
              </tr>
            ) : cashiers.length === 0 ? (
              <tr>
                <td colSpan={currentUser?.role === 'manager' ? 5 : 4} className="p-4 text-center text-gray-400">
                  Belum ada data staf kasir, supervisor, atau karyawan terdaftar.
                </td>
              </tr>
            ) : (
              cashiers.map((cashier) => (
                <tr key={cashier.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{cashier.name}</td>
                  <td className="p-4">@{cashier.username}</td>
                  <td className="p-4">{cashier.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                        cashier.role === 'manager'
                          ? 'bg-purple-100 text-purple-700'
                          : cashier.role === 'supervisor'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {cashier.role === 'manager' ? (
                        <Shield size={12} />
                      ) : cashier.role === 'supervisor' ? (
                        <ClipboardCheck size={12} />
                      ) : (
                        <User size={12} />
                      )}
                      {cashier.role.charAt(0).toUpperCase() + cashier.role.slice(1)}
                    </span>
                  </td>
                  {currentUser?.role === 'manager' && (
                    <td className="p-4 text-center flex justify-center gap-3">
                      <button
                        onClick={() => handleOpenEditModal(cashier)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Edit Data"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cashier.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Hapus Akun"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Popup Form (Digunakan Bersama untuk Tambah / Edit Karyawan) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {isEditMode ? 'Edit Data Karyawan' : 'Tambah Staf Baru'}
            </h2>

            {!isEditMode && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg mb-4 text-sm">
                📍 Cabang: <strong>{activeCafe?.name}</strong>
              </div>
            )}

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="Nama Lengkap Karyawan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="username_karyawan"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder="staf@kasir.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password {isEditMode && <span className="text-xs font-normal text-gray-400">(Kosongkan jika tidak diubah)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    placeholder="••••••••"
                    required={!isEditMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role Jabatan</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                >
                  <option value="kasir">Kasir</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}