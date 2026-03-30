'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Spin } from 'antd';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect based on user role
    if (user) {
      const role = user.status.toLowerCase();
      switch (role) {
        case 'ceo':
          router.push('/modules/ceo');
          break;
        case 'bugalter':
          router.push('/modules/accounting');
          break;
        case 'driver':
          router.push('/modules/driver');
          break;
        case 'owner':
          router.push('/modules/owner');
          break;
        case 'cashier':
          router.push('/modules/cashier');
          break;
        case 'zaphos':
          router.push('/modules/zaphos');
          break;
        default:
          // If role is not recognized, redirect to login
          router.push('/login');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Spin size="large" />
        <span style={{ color: '#666' }}>Yo'naltirilmoqda...</span>
      </div>
    </div>
  );
}