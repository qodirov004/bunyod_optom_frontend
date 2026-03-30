'use client';

import { Login } from '@/auth/Login';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spin } from 'antd';

export default function LoginPage() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect to appropriate page
    if (isAuthenticated && user && !isRedirecting) {
      setIsRedirecting(true);
      const role = user.status.toLowerCase();
      
      console.log('LoginPage: Authenticated user detected, redirecting...', role);

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
          console.log('LoginPage: Unknown role, staying on login');
          setIsRedirecting(false);
          break;
      }
    }
  }, [isAuthenticated, user, router, isRedirecting]);

  if (isRedirecting) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Spin size="large" />
          <span style={{ color: '#666' }}>Kabinetga yo'naltirilmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <Login />
  );
} 