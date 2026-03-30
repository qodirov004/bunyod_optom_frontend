'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function AdminAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
    
    // If authenticated and on login page, redirect to correct module
    if (isAuthenticated && pathname === '/login') {
      // Determine redirection based on status
      const status = user?.status?.toLowerCase();
      if (status === 'ceo') router.push('/modules/ceo');
      else if (status === 'bugalter') router.push('/modules/accounting');
      else if (status === 'driver') router.push('/modules/driver');
      else if (status === 'owner') router.push('/modules/owner');
      else if (status === 'cashier') router.push('/modules/cashier');
      else if (status === 'zaphos') router.push('/modules/zaphos');
      else router.push('/');
    }
  }, [isAuthenticated, pathname, router, user?.status]);

  // Show nothing while checking authentication
  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
} 