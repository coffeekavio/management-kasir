'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '@/services/authService';
import Image from 'next/image';
import bg from '../../assets/bg.png';
import logo from '../../assets/logo-velo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gunakan authService untuk handle login
      const authenticatedUser = await authService.login({ email, password });

      // Simpan ke Zustand store
      login(authenticatedUser);

      // Redirect ke dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mencoba masuk.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <Image src={bg} alt="background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1976D2] to-[#42A5F5" />

      {/* Logo fixed left */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-3">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Image src={logo} alt="logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-white">POS</h2>
          <p className="text-blue-100 text-sm">Sistem Manajemen Penjualan</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-xs">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Login</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email terdaftar"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 placeholder-gray-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-gray-600">Ingat saya</span>
                </label>
                {/* <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Lupa password?
                </a> */}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E88E5] hover:bg-[#1565C0] disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors duration-200 shadow-md"
              >
                {loading ? 'Memproses Autentikasi...' : 'Login'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-blue-100 text-sm mt-8">
            © 2026 Velo. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
}