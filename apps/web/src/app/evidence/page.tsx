'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Редирект со старой страницы /evidence на /traces (Журнал)
 */
export default function EvidencePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/traces');
  }, [router]);

  return <LoadingSpinner fullScreen text="Переход в журнал..." />;
}
