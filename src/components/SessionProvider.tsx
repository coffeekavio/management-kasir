'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { restoreSession } from '@/lib/sessionManager';

/**
 * SessionProvider Component
 * Menangani restore session saat app mount dan route protection
 */
export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Restore session dari localStorage saat app mount
    const initSession = async () => {
      const sessionRestored = await restoreSession();
      
      // Jika user tidak authenticated dan bukan di halaman login, redirect ke login
      if (!isAuthenticated && !sessionRestored && pathname !== '/login') {
        router.push('/login');
      }
    };

    initSession();
  }, [pathname, router, isAuthenticated]);

  return <>{children}</>;
};
