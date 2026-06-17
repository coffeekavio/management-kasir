'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { Eye, EyeOff, Plus, Shield, ClipboardCheck, User, X, Edit2, Trash2 } from 'lucide-react';
import { cashierService, type Cashier } from '@/services/cashierService';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { modalDeleteConfirm, modalLoading, modalSuccess, modalError as showModalError, toastSuccess } from '@/components/Modals';

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
      const data = await cashierService.getEmployeesByCafe(activeCafeId);
      setCashiers(data);
      setPageError(''); // Clear error jika berhasil
    } catch (err) {
      const error = err as Error;
      console.error('Gagal mengambil data dari server:', error);
      setPageError(error.message || 'Terjadi kesalahan saat memuat data karyawan');
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
        // Logika UPDATE/EDIT data
        await cashierService.updateEmployee(editingId, {
          email,
          username,
          full_name: fullName,
          role,
          ...(password ? { password } : {}) // Hanya kirim password jika diisi
        });

        setCashiers(cashiers.map(c => c.id === editingId ? { ...c, name: fullName, email, role: role as 'kasir' | 'supervisor' | 'manager', username } : c));
        setIsModalOpen(false);
        setModalError('');
        modalSuccess('Berhasil', 'Data karyawan berhasil diperbarui');
      } else {
        // Logika INSERT/TAMBAH data baru
        // Pastikan activeCafeId ada sebelum tambah
        if (!activeCafeId) {
          throw new Error('Silakan pilih cabang terlebih dahulu di navbar (refresh halaman jika belum ada)');
        }

        const result = await cashierService.createEmployee({ 
          email, 
          password, 
          username, 
          full_name: fullName, 
          role,
          cafe_id: activeCafeId // Gunakan activeCafeId dari dropdown cabang
        });

        const newCashier: Cashier = {
          id: result.user_id,
          name: fullName,
          email: email,
          role: role as 'kasir' | 'supervisor' | 'manager',
          username: username,
        };
        setCashiers([...cashiers, newCashier]);
        setIsModalOpen(false);
        setModalError('');
        modalSuccess('Berhasil', 'Data karyawan berhasil ditambahkan');
      }
    } catch (err) {
      const error = err as Error;
      setModalError(error.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  // 3. INTEGRASI DELETE: Menghapus akun karyawan (gunakan shared modal helpers)
  const handleDelete = async (id: string) => {
    const confirmed = await modalDeleteConfirm('Akun Karyawan', `ID: ${id}`);
    if (!confirmed) return;

    try {
      modalLoading('Menghapus data karyawan...');
      await cashierService.deleteEmployee(id);
      setCashiers((prev) => prev.filter((cashier) => cashier.id !== id));
      modalSuccess('Terhapus', 'Data karyawan berhasil dihapus');
    } catch (err) {
      const error = err as Error;
      showModalError('Gagal', error.message || 'Gagal menghapus data');
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Karyawan</h1>
          <p className="text-gray-600">Kelola data kasir, supervisor, dan staf toko Anda</p>
          {/* <p className="text-sm text-blue-600 font-medium mt-2">
            📍 Cabang: <span className="font-semibold">{activeCafe?.name || 'Memilih cabang...'}</span>
          </p> */}
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

      {/* Tampilan Tabel Utama (MaterialReactTable) */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="min-w-full">
          <MaterialReactTable table={useMaterialReactTable({
            columns: useMemo<MRT_ColumnDef<Cashier>[]>(
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
                  header: 'Nama',
                },
                {
                  accessorKey: 'username',
                  header: 'Username',
                  Cell: ({ cell }) => `@${cell.getValue<string>()}`,
                },
                {
                  accessorKey: 'email',
                  header: 'Email',
                },
                {
                  accessorKey: 'role',
                  header: 'Role',
                  Cell: ({ cell }) => {
                    const role = cell.getValue<string>();
                    return (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                          role === 'manager'
                            ? 'bg-purple-100 text-purple-700'
                            : role === 'supervisor'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {role === 'manager' ? <Shield size={12} /> : role === 'supervisor' ? <ClipboardCheck size={12} /> : <User size={12} />}
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    );
                  },
                },
                {
                  id: 'actions',
                  header: 'Aksi',
                  enableSorting: false,
                  Cell: ({ row }) => (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(row.original)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.original.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                        Hapus
                      </button>
                    </div>
                  ),
                },
              ],
              []
            ),
            data: cashiers,
            state: { isLoading: pageLoading },
            enableColumnFilterModes: true,
            enableGlobalFilter: true,
            enablePagination: true,
            enableSorting: true,
            initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
            muiTableProps: { sx: { borderCollapse: 'collapse' } },
            muiTableHeadCellProps: { sx: { backgroundColor: '#f9fafb' } },
            muiTableBodyCellProps: { sx: { padding: '12px 16px' } },
            muiSearchTextFieldProps: { placeholder: 'Cari karyawan...', variant: 'outlined', size: 'small', fullWidth: false },
          })} />
        </div>
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