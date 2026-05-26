'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { memberService, Member } from '@/services/memberService';
import { Plus, Edit2, Trash2, X, Save, Search, Gift } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);

  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  // Form State
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    points: 0,
  });

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      if (!activeCafeId) {
        return;
      }

      const data = await memberService.getMembers(activeCafeId);
      setMembers(data);
    } catch (error: unknown) {
      console.error('Gagal mengambil data member:', error);
    }
  }, [activeCafeId]);

  useEffect(() => {
    if (activeCafeId) {
      fetchMembers();
    }
  }, [activeCafeId, fetchMembers]);

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
      alert('Nama member wajib diisi!');
      return;
    }

    if (memberForm.points < 0) {
      alert('Poin tidak boleh negatif!');
      return;
    }

    try {
      if (!activeCafeId) {
        alert('ID Kafe tidak ditemukan. Silakan login ulang.');
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
        alert(`Member "${memberForm.name}" berhasil diperbarui!`);
      } else {
        // TAMBAH MEMBER BARU
        await memberService.createMember({
          cafe_id: activeCafeId,
          name: memberForm.name,
          phone: memberForm.phone || undefined,
          points: memberForm.points,
        });
        alert(`Member "${memberForm.name}" berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
      fetchMembers();
    } catch (error: unknown) {
      console.error('Gagal menyimpan member:', error);
      const errorMsg =
        error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'detail' in error.response.data
          ? (error.response.data as { detail: string }).detail
          : 'Terjadi kesalahan pada server.';
      alert(`Gagal menyimpan member: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Hapus member
  const handleDeleteMember = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus member "${name}"?`)) {
      try {
        await memberService.deleteMember(id);
        setMembers(members.filter((m) => m.id !== id));
        alert(`Member "${name}" berhasil dihapus!`);
      } catch (err: unknown) {
        console.error('Gagal menghapus member:', err);
        alert('Gagal menghapus member');
      }
    }
  };

  // Add/Reduce points
  const handleAdjustPoints = async (id: string, pointsChange: number) => {
    try {
      const updated = await memberService.updateMemberPoints(id, pointsChange);
      setMembers(members.map((m) => (m.id === id ? updated : m)));
    } catch (err: unknown) {
      console.error('Gagal mengubah poin:', err);
      alert('Gagal mengubah poin member');
    }
  };

  // Filter members berdasarkan search
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari nama atau nomor telepon member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm"
          />
        </div>
      </div>

      {/* Table Members */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Nama Member</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Nomor Telepon</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Poin Reward</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Bergabung</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Belum ada member terdaftar
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {member.points} poin
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Add Points Button */}
                        <button
                          onClick={() => handleAdjustPoints(member.id, 1)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
                          title="Tambah 1 poin"
                        >
                          <Gift size={13} />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditMember(member)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                        >
                          <Edit2 size={13} />
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
}
