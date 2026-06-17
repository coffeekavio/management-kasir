'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/lib/store';
import { memberService, Member } from '@/services/memberService';
import { Plus, Edit2, Trash2, X, Save, Settings } from 'lucide-react';
import { useCrudAlert } from '@/hooks/useAlert';
import { memberSettingsService, MemberSettings } from '@/services/memberSettingsService';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  modalConfirm,
  modalDeleteConfirm,
  modalLoading,
  modalSuccess,
  modalError as showModalError,
} from '@/components/Modals';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [memberSettings, setMemberSettings] = useState<MemberSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const alert = useCrudAlert();

  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  // Form State
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    points: 0,
  });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    earning_amount: 10000,
    earning_points: 1,
    redemption_points: 100,
    redemption_discount: 10,
  });

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      if (!activeCafeId) {
        return;
      }

      setMembersLoading(true);
      const data = await memberService.getMembers(activeCafeId);
      setMembers(data);
    } catch (error: unknown) {
      console.error('Gagal mengambil data member:', error);
    } finally {
      setMembersLoading(false);
    }
  }, [activeCafeId]);

  useEffect(() => {
    if (activeCafeId) {
      fetchMembers();
    }
  }, [activeCafeId, fetchMembers]);

  // Fetch member settings
  useEffect(() => {
    if (activeCafeId) {
      memberSettingsService.getSettings(activeCafeId).then((settings) => {
        setMemberSettings(settings);
        setSettingsForm({
          earning_amount: settings.earning_amount,
          earning_points: settings.earning_points,
          redemption_points: settings.redemption_points,
          redemption_discount: settings.redemption_discount,
        });
      });
    }
  }, [activeCafeId]);

  // Buka modal tambah member
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      phone: '',
      points: 0,
    });
    setIsModalOpen(true);
  };

  // Buka modal edit member
  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      phone: member.phone || '',
      points: member.points,
    });
    setIsModalOpen(true);
  };

  // Submit simpan member (POST/PUT)
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberForm.name.trim()) {
      alert.error('Validasi', 'Nama member wajib diisi!');
      return;
    }

    if (memberForm.points < 0) {
      alert.error('Validasi', 'Poin tidak boleh negatif!');
      return;
    }

    const saveConfirmed = await modalConfirm(
      editingMember ? 'Simpan perubahan member?' : 'Tambah member baru?',
      editingMember
        ? 'Perubahan data member akan disimpan ke server.'
        : 'Data member baru akan ditambahkan ke server.',
      'Ya, Simpan',
      'Batal',
      'question'
    );

    if (!saveConfirmed) {
      return;
    }

    try {
      if (!activeCafeId) {
        alert.error('Error', 'ID Kafe tidak ditemukan. Silakan login ulang.');
        return;
      }

      setLoading(true);

      if (editingMember) {
        // EDIT MEMBER
        await memberService.updateMember(editingMember.id, {
          name: memberForm.name,
          phone: memberForm.phone || undefined,
          points: memberForm.points,
        });
        alert.successAfterLoading('Member Berhasil Diperbarui!');
      } else {
        // TAMBAH MEMBER BARU
        await memberService.createMember({
          cafe_id: activeCafeId,
          name: memberForm.name,
          phone: memberForm.phone || undefined,
          points: memberForm.points,
        });
        alert.successAfterLoading('Member Berhasil Ditambahkan!');
      }

      setIsModalOpen(false);
      fetchMembers();
    } catch (error: unknown) {
      console.error('Gagal menyimpan member:', error);
      const errorMsg =
        error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data
          ? (error.response.data as { detail: string }).detail
          : 'Terjadi kesalahan pada server.';
      alert.error('Gagal Menyimpan Member', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Hapus member
  const handleDeleteMember = async (id: string, name: string) => {
    const confirmed = await modalDeleteConfirm(name, 'Member akan dihapus dari sistem');

    if (confirmed) {
      try {
        modalLoading('Menghapus member...');
        await memberService.deleteMember(id);
        setMembers((prev) => prev.filter((m) => m.id !== id));
        modalSuccess('Berhasil', 'Member berhasil dihapus!');
      } catch (err: unknown) {
        console.error('Gagal menghapus member:', err);
        const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus member dari server';
        showModalError('Gagal Menghapus', errorMessage);
      }
    }
  };

  // Add/Reduce points
  const handleAdjustPoints = async (id: string, pointsChange: number) => {
    try {
      alert.loading('Mengubah poin...');
      const updated = await memberService.updateMemberPoints(id, pointsChange);
      setMembers(members.map((m) => (m.id === id ? updated : m)));
      alert.successAfterLoading('Poin Berhasil Diubah!');
    } catch (err: unknown) {
      console.error('Gagal mengubah poin:', err);
      alert.error('Gagal Mengubah Poin', 'Gagal mengubah poin member');
    }
  };

  // Save settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeCafeId) {
      alert.error('Error', 'ID Kafe tidak ditemukan');
      return;
    }

    if (settingsForm.earning_amount <= 0 || settingsForm.earning_points <= 0) {
      alert.error('Validasi', 'Nilai earning harus lebih dari 0');
      return;
    }

    if (settingsForm.redemption_points <= 0 || settingsForm.redemption_discount <= 0) {
      alert.error('Validasi', 'Nilai redemption harus lebih dari 0');
      return;
    }

    const settingsConfirmed = await modalConfirm(
      'Simpan pengaturan poin?',
      'Perubahan aturan poin member akan diterapkan untuk cafe ini.',
      'Ya, Simpan',
      'Batal',
      'question'
    );

    if (!settingsConfirmed) {
      return;
    }

    try {
      alert.loading('Menyimpan pengaturan...');
      setSettingsLoading(true);

      const result = await memberSettingsService.updateSettings({
        cafe_id: activeCafeId,
        earning_amount: settingsForm.earning_amount,
        earning_points: settingsForm.earning_points,
        redemption_points: settingsForm.redemption_points,
        redemption_discount: settingsForm.redemption_discount,
      });

      setMemberSettings(result);
      alert.successAfterLoading('Pengaturan Member Berhasil Disimpan!');
      setShowSettings(false);
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      let errorMsg = 'Gagal menyimpan pengaturan';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      alert.error('Gagal Menyimpan', errorMsg);
    } finally {
      setSettingsLoading(false);
    }
  };

  const columns = useMemo<MRT_ColumnDef<Member>[]>(
    () => [
      {
        id: 'no',
        header: 'No',
        size: 60,
        enableSorting: false,
        Cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination || {
            pageIndex: 0,
            pageSize: 10,
          };
          return pageIndex * pageSize + row.index + 1;
        },
      },
      {
        accessorKey: 'name',
        header: 'Nama Member',
      },
      {
        accessorKey: 'phone',
        header: 'Nomor Telepon',
        Cell: ({ cell }) => cell.getValue<string>() || '-',
      },
      {
        accessorKey: 'points',
        header: 'Poin Reward',
        Cell: ({ cell }) => (
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {cell.getValue<number>()} poin
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Bergabung',
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value
            ? new Date(value).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '-';
        },
      },
      {
        id: 'actions',
        header: 'Aksi',
        enableSorting: false,
        Cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenEditMember(row.original)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
            >
              <Edit2 size={13} />
              Edit
            </button>
            <button
              onClick={() => handleDeleteMember(row.original.id, row.original.name)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              <Trash2 size={13} />
              Hapus
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: members,
    state: {
      isLoading: membersLoading,
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
    muiTableBodyRowProps: {
      sx: {
        '&:hover': {
          backgroundColor: '#f0f4f8',
        },
        borderBottom: '1px solid #f3f4f6',
      },
    },
    muiSearchTextFieldProps: {
      placeholder: 'Cari nama atau nomor telepon member...',
      variant: 'outlined',
      size: 'small',
      fullWidth: false,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Member</h1>
          <p className="text-gray-600 mt-1">Kelola data member dan poin reward sistem kasir</p>
        </div>
        <button
          onClick={handleOpenAddMember}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
        >
          <Plus size={18} />
          Tambah Member Baru
        </button>
      </div>

      {/* Member Settings Card */}
      {memberSettings && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-md border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Settings size={22} className="text-purple-600" />
                Pengaturan Sistem Poin Member
              </h2>
              <p className="text-sm text-gray-600 mt-1">⚠️ Setiap cafe hanya memiliki 1 pengaturan</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              title="Edit pengaturan poin member"
            >
              <Edit2 size={16} />
              Ubah Pengaturan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earning Rules */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  📈
                </span>
                Aturan Mendapatkan Poin
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Setiap transaksi</span>
                  <span className="font-bold text-blue-600 text-lg">
                    Rp {memberSettings.earning_amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Dapat poin</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {memberSettings.earning_points} poin
                  </span>
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                  💡 Contoh: Belanja Rp {memberSettings.earning_amount.toLocaleString('id-ID')} = {memberSettings.earning_points} poin
                </div>
              </div>
            </div>

            {/* Redemption Rules */}
            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  🎁
                </span>
                Aturan Tukar Poin → Diskon
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Tukar poin</span>
                  <span className="font-bold text-green-600 text-lg">
                    {memberSettings.redemption_points} poin
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Dapat diskon</span>
                  <span className="font-bold text-green-600 text-lg">
                    {memberSettings.redemption_discount}%
                  </span>
                </div>
                <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
                  💡 Contoh: {memberSettings.redemption_points} poin = {memberSettings.redemption_discount}% diskon dari total belanja
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Members */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="min-w-full">
          <MaterialReactTable table={table} />
        </div>
      </div>

      {/* Modal Tambah & Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 my-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-md">
                {editingMember ? 'Edit Data Member' : 'Tambah Member Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              {/* Nama Member */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Member
                </label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, name: e.target.value })
                  }
                  placeholder="Masukkan nama member"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nomor Telepon */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={memberForm.phone}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, phone: e.target.value })
                  }
                  placeholder="Misal: 08123456789 (opsional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Poin Awal */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Poin Reward Awal
                </label>
                <input
                  type="number"
                  value={memberForm.points}
                  onChange={(e) =>
                    setMemberForm({
                      ...memberForm,
                      points: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Button Simpan & Batal */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg text-xs transition-colors"
                >
                  <Save size={15} />
                  {loading ? 'Menyimpan...' : 'Simpan Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Settings Poin */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings size={22} />
                <h3 className="font-bold text-lg">Pengaturan Sistem Poin Member</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
              {/* Section 1: Aturan Mendapatkan Poin */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    1
                  </span>
                  Aturan Mendapatkan Poin
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Setiap Transaksi Rp
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={settingsForm.earning_amount}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            earning_amount: parseInt(e.target.value) || 0,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-gray-500">,00</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Mendapat Poin
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settingsForm.earning_points}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          earning_points: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-900">
                  💡 <strong>Contoh:</strong> Setiap Rp {settingsForm.earning_amount.toLocaleString('id-ID')} transaksi = {settingsForm.earning_points} poin
                </div>
              </div>

              {/* Section 2: Aturan Tukar Poin */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    2
                  </span>
                  Aturan Tukar Poin menjadi Diskon
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Tukar Poin
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settingsForm.redemption_points}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          redemption_points: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Dapat Diskon
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={settingsForm.redemption_discount}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            redemption_discount: parseInt(e.target.value) || 1,
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-green-100 rounded text-xs text-green-900">
                  💡 <strong>Contoh:</strong> {settingsForm.redemption_points} poin = Diskon {settingsForm.redemption_discount}%
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-3">📊 Ringkasan Pengaturan</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Earning Rate:</span>
                    <p className="font-bold text-blue-600">
                      Rp {settingsForm.earning_amount.toLocaleString('id-ID')} = {settingsForm.earning_points} poin
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Redemption Rate:</span>
                    <p className="font-bold text-green-600">
                      {settingsForm.redemption_points} poin = {settingsForm.redemption_discount}% diskon
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
                >
                  <Save size={16} />
                  {settingsLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}