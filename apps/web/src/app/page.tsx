'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Проверяем, прошел ли пользователь онбординг
        const hasSeenIntroduce = typeof window !== 'undefined' 
          ? localStorage.getItem('hasSeenIntroduce') 
          : null;
        
        if (!hasSeenIntroduce) {
          // Первый вход - редиректим на страницу онбординга
          router.push('/introduce');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return <LoadingSpinner fullScreen text="Загрузка..." />;
}

