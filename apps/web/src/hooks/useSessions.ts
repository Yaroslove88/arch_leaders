import { useQuery } from '@tanstack/react-query';
import { getSessions, getSession } from '../lib/api';
import { getToken } from '../lib/api';

export function useSessions(params?: { status?: string }) {
  const token = typeof window !== 'undefined' ? getToken() : null;
  
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => getSessions(params),
    enabled: !!token, // Запрос выполняется только если есть токен
    retry: false,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => getSession(id),
    enabled: !!id,
  });
}

