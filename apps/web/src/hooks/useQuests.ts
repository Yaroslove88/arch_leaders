import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuests, getQuest, createQuest, completeQuest, Quest, getToken } from '../lib/api';

export function useQuests(status?: string) {
  const token = typeof window !== 'undefined' ? getToken() : null;
  
  return useQuery({
    queryKey: ['quests', status],
    queryFn: () => getQuests(status),
    enabled: !!token, // Запрос выполняется только если есть токен
    retry: false,
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: ['quest', id],
    queryFn: () => getQuest(id),
    enabled: !!id,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, evidenceId }: { id: string; evidenceId?: string }) =>
      completeQuest(id, evidenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}

