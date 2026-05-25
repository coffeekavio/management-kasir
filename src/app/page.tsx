'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Redirect based on authentication state from Zustand store
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-400">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
          <div className="text-3xl font-bold text-blue-600">₹</div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Manager Kasir</h1>
        <p className="text-blue-100">Sedang memproses...</p>
      </div>
    </div>
  );
}
