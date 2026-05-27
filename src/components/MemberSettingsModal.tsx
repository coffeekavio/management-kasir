'use client';

import { useState } from 'react';
import { X, Settings, Save } from 'lucide-react';
import { MemberSettings, memberSettingsService } from '@/services/memberSettingsService';
import { useCrudAlert } from '@/hooks/useAlert';
import { formatCurrency } from '@/lib/utils';

interface MemberSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MemberSettings;
  onSave: (settings: MemberSettings) => void;
  activeCafeId: string;
}

export default function MemberSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  activeCafeId,
}: MemberSettingsModalProps) {
  const alert = useCrudAlert();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    earning_amount: settings.earning_amount,
    earning_points: settings.earning_points,
    redemption_points: settings.redemption_points,
    redemption_discount: settings.redemption_discount,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.earning_amount <= 0 || formData.earning_points <= 0) {
      alert.error('Validasi', 'Nilai harus lebih dari 0');
      return;
    }

    if (formData.redemption_points <= 0 || formData.redemption_discount <= 0) {
      alert.error('Validasi', 'Nilai reward harus lebih dari 0');
      return;
    }

    try {
      alert.loading('Menyimpan pengaturan...');
      setLoading(true);

      const result = await memberSettingsService.updateSettings({
        cafe_id: activeCafeId,
        earning_amount: formData.earning_amount,
        earning_points: formData.earning_points,
        redemption_points: formData.redemption_points,
        redemption_discount: formData.redemption_discount,
      });

      alert.successAfterLoading('Pengaturan Member Berhasil Disimpan!');
      onSave(result);
      onClose();
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      let errorMsg = 'Gagal menyimpan pengaturan';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      alert.error('Gagal Menyimpan', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings size={22} />
            <h3 className="font-bold text-lg">Pengaturan Sistem Poin Member</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    value={formData.earning_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
                  value={formData.earning_points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      earning_points: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-100 rounded text-xs text-blue-900">
              💡 <strong>Contoh:</strong> Setiap Rp {formData.earning_amount.toLocaleString('id-ID')} transaksi
              = {formData.earning_points} poin
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
                  value={formData.redemption_points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
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
                    value={formData.redemption_discount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
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
              💡 <strong>Contoh:</strong> {formData.redemption_points} poin = Diskon {formData.redemption_discount}%
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-bold text-gray-800 mb-3">📊 Ringkasan Pengaturan</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Earning Rate:</span>
                <p className="font-bold text-blue-600">
                  Rp {formData.earning_amount.toLocaleString('id-ID')} = {formData.earning_points} poin
                </p>
              </div>
              <div>
                <span className="text-gray-600">Redemption Rate:</span>
                <p className="font-bold text-green-600">
                  {formData.redemption_points} poin = {formData.redemption_discount}% diskon
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              <Save size={16} />
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}