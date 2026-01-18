'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Редирект со старой страницы /entries на /traces (Журнал)
 */
export default function EntriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/traces');
  }, [router]);

  return <LoadingSpinner fullScreen text="Переход в журнал..." />;
}
