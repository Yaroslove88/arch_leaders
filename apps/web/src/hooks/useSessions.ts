import { useQuery } from '@tanstack/react-query';
import { getSessions, getSession } from '../lib/api';

export function useSessions(params?: { status?: string }) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => getSessions(params),
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
