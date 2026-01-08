import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEntries, getEntry, createEntry, Entry } from '../lib/api';

export function useEntries(params?: { type?: string; limit?: number }) {
  return useQuery({
    queryKey: ['entries', params],
    queryFn: () => getEntries(params),
  });
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ['entry', id],
    queryFn: () => getEntry(id),
    enabled: !!id,
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    },
  });
}

