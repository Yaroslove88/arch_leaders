import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuests, getQuest, createQuest, completeQuest } from '../lib/api';

export function useQuests(status?: string) {
  return useQuery({
    queryKey: ['quests', status],
    queryFn: () => getQuests(status),
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
