'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Редирект со старой страницы /evidence/new на /traces (Журнал)
 * Рефлексии теперь добавляются через модалку в журнале или на странице квеста
 */
export default function NewEvidencePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/traces');
  }, [router]);

  return <LoadingSpinner fullScreen text="Переход в журнал..." />;
}
