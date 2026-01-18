'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useQuests } from '../../hooks/useQuests';
import { useSessions } from '../../hooks/useSessions';
import { useEntries } from '../../hooks/useEntries';
import { getSemanticTree, getCurrentBuild, getToken, getCaseProgress, CaseProgress, getUserRetention, UserRetention, recordActivity, checkStreakRisk, createEntry, getUserAchievements, UserAchievement } from '../../lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { AddSituationModal, AddEvidenceModal, type SituationFormData, type EvidenceFormData } from '../../components/modals';
import { createEvidence } from '../../lib/api';
import { useToast } from '../../components/ToastProvider';
import { StreakIndicator, AchievementPopup } from '../../components/gamification';
import { Achievement, ACHIEVEMENTS } from '../../lib/gamification';

interface NodeChange {
  nodeId: string;
  nodeName: string;
  changeType: 'available' | 'integrated' | 'lost_relevance';
  timestamp: string;
}

function DashboardContent() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [recentChanges, setRecentChanges] = useState<NodeChange[]>([]);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [lastAchievementsCount, setLastAchievementsCount] = useState<number>(0);
  const { user } = useAuth();
  const userId = user?.id; // Используем реальный userId из auth
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Обработчик сохранения новой ситуации
  const handleSaveSituation = async (data: SituationFormData) => {
    setIsSaving(true);
    try {
      const entry = await createEntry({
        type: 'situation',
        source: 'web',
        text: data.description || data.title,
        participants: [],
        tags: [],
      });
      
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.showToast('Ситуация добавлена в журнал', 'success');
      setIsEntryModalOpen(false);
      router.push('/traces');
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при создании ситуации', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Обработчик сохранения рефлексии
  const handleSaveEvidence = async (data: EvidenceFormData) => {
    setIsSaving(true);
    try {
      await createEvidence({
        type: 'reflection',
        text: data.text,
        quest_id: data.questId,
        ability_node_id: data.nodeId,
        tags: [],
      });
      
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      toast.showToast('Рефлексия добавлена', 'success');
      setIsEvidenceModalOpen(false);
    } catch (error: any) {
      toast.showToast(error?.message || 'Ошибка при сохранении', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Получаем токен только на клиенте после монтирования
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      setMounted(true);
      const currentToken = getToken();
      setToken(currentToken);
      
      // Проверяем, прошел ли пользователь онбординг
      const hasSeenIntroduce = localStorage.getItem('hasSeenIntroduce');
      if (!hasSeenIntroduce && currentToken) {
        // Первый вход - редиректим на страницу онбординга
        router.push('/introduce');
        return;
      }
      
      const savedChanges = localStorage.getItem('node_changes');
      if (savedChanges) {
        try {
          const parsed = JSON.parse(savedChanges);
          if (Array.isArray(parsed)) {
            setRecentChanges(parsed);
          }
        } catch (parseError) {
          console.error('Failed to parse saved changes', parseError);
        }
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    }
  }, [router]);

  const { data: questsData, isLoading: questsLoading } = useQuests('active');
  const { data: sessionsData, isLoading: sessionsLoading } = useSessions({ status: 'done' });
  const { data: entriesData } = useEntries({ limit: 10 });
  const { data: tree, isLoading: treeLoading } = useQuery({
    queryKey: ['tree', 'semantic'],
    queryFn: getSemanticTree,
    enabled: !!token && mounted,
    retry: false,
  });
  const { data: currentBuilds, isLoading: buildsLoading } = useQuery({
    queryKey: ['builds', 'current'],
    queryFn: getCurrentBuild,
    enabled: !!token && mounted,
    retry: false,
  });
  const { data: caseProgress } = useQuery({
    queryKey: ['caseProgress'],
    queryFn: getCaseProgress,
    enabled: !!token && mounted,
  });
  const { data: retention } = useQuery({
    queryKey: ['retention', userId],
    queryFn: () => getUserRetention(userId!),
    enabled: mounted && !!userId,
  });
  const { data: streakRisk } = useQuery({
    queryKey: ['streakRisk', userId],
    queryFn: () => checkStreakRisk(userId!),
    enabled: mounted && !!userId,
    refetchInterval: 60000, // Проверяем каждую минуту
  });
  const { data: userAchievements } = useQuery({
    queryKey: ['achievements', userId],
    queryFn: () => getUserAchievements(userId),
    enabled: mounted && !!userId,
  });

  // Записываем активность при загрузке дашборда
  useEffect(() => {
    if (mounted && userId) {
      recordActivity(userId, 'any').catch(console.error);
    }
  }, [mounted, userId]);

  // Отслеживаем новые достижения
  useEffect(() => {
    if (userAchievements && userAchievements.length > lastAchievementsCount) {
      // Нашли новое достижение
      const newAchievements = userAchievements.slice(lastAchievementsCount);
      if (newAchievements.length > 0) {
        // Показываем последнее разблокированное достижение
        const latest = newAchievements[newAchievements.length - 1];
        // Проверяем, что achievement_id существует
        if (!latest?.achievement_id) {
          setLastAchievementsCount(userAchievements.length);
          return;
        }
        // Находим полную информацию о достижении из каталога
        const achievementDef = ACHIEVEMENTS.find(a => a.id === latest.achievement_id);
        if (achievementDef) {
          setNewAchievement({
            ...achievementDef,
            isUnlocked: true,
            unlockedAt: latest.unlocked_at,
          });
        } else {
          // Fallback если достижение не найдено в каталоге
          setNewAchievement({
            id: latest.achievement_id,
            title: latest.achievement_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: `Достижение разблокировано`,
            icon: '🏆',
            category: 'first_steps',
            isUnlocked: true,
            unlockedAt: latest.unlocked_at,
          });
        }
      }
      setLastAchievementsCount(userAchievements.length);
    } else if (userAchievements) {
      setLastAchievementsCount(userAchievements.length);
    }
  }, [userAchievements, lastAchievementsCount]);

  const quests = questsData?.quests || [];
  const activeQuests = useMemo(() => 
    quests.filter((q: any) => q.status === 'active').slice(0, 5),
    [quests]
  );
  const sessions = useMemo(() => 
    sessionsData?.sessions?.slice(0, 5) || [],
    [sessionsData]
  );
  const recentEntries = useMemo(() => 
    entriesData?.entries?.slice(0, 3) || [],
    [entriesData]
  );

  const unlockedNodes = useMemo(() => 
    tree?.nodes?.filter((n: any) => 
      n.state === 'active' || n.state === 'available' || n.state === 'unlocked' || n.state === 'integrated'
    ).length || 0,
    [tree]
  );

  const activeBuilds = useMemo(() => 
    Array.isArray(currentBuilds) ? currentBuilds.filter((b: any) => b.is_active) : [],
    [currentBuilds]
  );

  // Фокус - приоритетный активный квест
  const currentFocus = useMemo(() => {
    if (activeQuests.length > 0) {
      return { type: 'quest' as const, data: activeQuests[0] };
    } else if (recentEntries.length > 0) {
      return { type: 'entry' as const, data: recentEntries[0] };
    }
    return null;
  }, [activeQuests, recentEntries]);

  // Отслеживание изменений узлов
  useEffect(() => {
    if (!tree?.nodes || !mounted || typeof window === 'undefined') return;

    try {
      const savedNodeStates = localStorage.getItem('node_states');
      const previousStates = savedNodeStates ? JSON.parse(savedNodeStates) : {};
      const currentStates: Record<string, string> = {};
      const newChanges: NodeChange[] = [];

      tree.nodes.forEach((node: any) => {
        currentStates[node.node_id] = node.state;
        const previousState = previousStates[node.node_id];

        if (previousState && previousState !== node.state) {
          if (node.state === 'available' && previousState === 'locked') {
            newChanges.push({
              nodeId: node.node_id,
              nodeName: node.name || node.node_id,
              changeType: 'available',
              timestamp: new Date().toISOString(),
            });
          } else if (node.state === 'integrated' && previousState !== 'integrated') {
            newChanges.push({
              nodeId: node.node_id,
              nodeName: node.name || node.node_id,
              changeType: 'integrated',
              timestamp: new Date().toISOString(),
            });
          }
        }
      });

      localStorage.setItem('node_states', JSON.stringify(currentStates));

      if (newChanges.length > 0) {
        setRecentChanges((prev) => {
          const allChanges = [...newChanges, ...prev].slice(0, 20);
          localStorage.setItem('node_changes', JSON.stringify(allChanges));
          return allChanges;
        });
      }
    } catch (error) {
      console.error('Error processing node changes:', error);
    }
  }, [tree, mounted]);

  const isLoading = !mounted || questsLoading || sessionsLoading || treeLoading || buildsLoading;

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Загрузка данных..." />;
  }

  const latestChanges = recentChanges.slice(0, 3);
  const solvedCasesCount = caseProgress?.solvedCases?.length || 0;

  return (
    <main className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-ash-light tracking-tight">Обзор</h1>

        {/* Главный блок фокуса */}
        <section className="bg-graphite-structure border border-ui-border-soft rounded-xl shadow-panel p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h2 className="text-lg font-semibold text-ash-light">Твой фокус сейчас</h2>
          </div>

          {currentFocus ? (
            currentFocus.type === 'quest' ? (
              <div className="bg-obsidian-core rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-ui-text-muted mb-1">Квест</p>
                    <h3 className="text-lg font-semibold text-ash-light mb-2">
                      {currentFocus.data.title}
                    </h3>
                    <p className="text-sm text-ui-text-muted line-clamp-2">
                      {currentFocus.data.description}
                    </p>
                  </div>
                  <span className="text-xs bg-strategic-blue/20 text-strategic-blue px-2 py-1 rounded">
                    {currentFocus.data.type === 'micro' ? 'Микро' : 
                     currentFocus.data.type === 'weekly' ? 'Недельный' : 
                     currentFocus.data.type === 'story' ? 'История' : currentFocus.data.type}
                  </span>
                </div>
                
                {/* Прогресс бар */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-ui-text-muted mb-1">
                    <span>Прогресс</span>
                    <span>—</span>
                  </div>
                  <div className="w-full bg-obsidian-core rounded-full h-2">
                    <div className="bg-strategic-blue h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Link 
                    href={`/quests/${currentFocus.data.id}`}
                    className="flex-1 bg-strategic-blue hover:bg-strategic-blue/90 text-white py-2.5 px-4 rounded-xl text-center text-sm font-medium transition-colors"
                  >
                    Продолжить квест →
                  </Link>
                  <button 
                    onClick={() => setIsEvidenceModalOpen(true)}
                    className="py-2.5 px-4 border border-ui-border-soft rounded-xl text-ash-light text-sm hover:bg-graphite-structure transition-colors text-center"
                  >
                    + Рефлексия
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-obsidian-core rounded-xl p-4">
                <p className="text-sm text-ui-text-muted mb-1">Последняя ситуация</p>
                <p className="text-ash-light line-clamp-2 mb-3">{currentFocus.data.text}</p>
                <Link 
                  href="/traces"
                  className="inline-block bg-strategic-blue hover:bg-strategic-blue/90 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
                >
                  Открыть журнал →
                </Link>
              </div>
            )
          ) : (
            <div className="bg-obsidian-core rounded-xl p-6 text-center">
              <p className="text-ui-text-muted mb-4">Нет активных квестов</p>
              <Link 
                href="/experiments"
                className="inline-block bg-strategic-blue hover:bg-strategic-blue/90 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors"
              >
                Выбрать квест
              </Link>
            </div>
          )}
        </section>

        {/* Прогресс - 3 метрики + серия */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-ui-text-muted mb-3">Твой прогресс</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
            <div className="bg-graphite-structure border border-ui-border-soft rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-strategic-blue">{activeQuests.length}</p>
              <p className="text-[10px] sm:text-xs text-ui-text-muted leading-tight">активных<br className="sm:hidden"/> квестов</p>
            </div>
            <div className="bg-graphite-structure border border-ui-border-soft rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-sage-green">{unlockedNodes}</p>
              <p className="text-[10px] sm:text-xs text-ui-text-muted leading-tight">узлов<br className="sm:hidden"/> открыто</p>
            </div>
            <div className="bg-graphite-structure border border-ui-border-soft rounded-xl p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-bold text-sage-green">{solvedCasesCount}</p>
              <p className="text-[10px] sm:text-xs text-ui-text-muted leading-tight">кейсов<br className="sm:hidden"/> решено</p>
            </div>
          </div>
          
          {/* Серия - используем компонент StreakIndicator */}
          {retention && retention.currentStreak > 0 && (
            <StreakIndicator
              streak={{
                currentStreak: retention.currentStreak,
                longestStreak: retention.longestStreak,
                lastActivityDate: retention.lastActivityDate,
                streakDays: (() => {
                  // Генерируем массив дней на основе текущей серии
                  // Показываем последние 7 дней, где активные дни = true
                  const days: boolean[] = [];
                  const today = new Date();
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    // Если серия активна и это последние N дней, где N = currentStreak
                    const isActive = retention.currentStreak > 0 && i >= (7 - Math.min(retention.currentStreak, 7));
                    days.push(isActive);
                  }
                  return days;
                })(),
              }}
            />
          )}
        </section>

        {/* Напоминания */}
        {streakRisk?.shouldRemind && (
          <section className="bg-catalyst-gold/10 border border-catalyst-gold rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔔</span>
              <h2 className="text-sm font-semibold text-ash-light">Напоминание</h2>
            </div>
            {streakRisk.daysWithoutActivity >= 3 ? (
              <div className="space-y-2">
                <p className="text-sm text-ash-light">
                  Ты не заходил {streakRisk.daysWithoutActivity} {streakRisk.daysWithoutActivity === 1 ? 'день' : streakRisk.daysWithoutActivity < 5 ? 'дня' : 'дней'}.
                </p>
                {activeQuests.length > 0 && (
                  <p className="text-sm text-ui-text-muted">
                    Твой квест «{activeQuests[0]?.title}» ждёт.
                  </p>
                )}
                <Link
                  href={activeQuests.length > 0 ? `/quests/${activeQuests[0]?.id}` : '/experiments'}
                  className="inline-block mt-2 text-sm text-strategic-blue hover:underline"
                >
                  Вернуться к квесту →
                </Link>
              </div>
            ) : streakRisk.isAtRisk ? (
              <div className="space-y-2">
                <p className="text-sm text-ash-light">
                  Серия прервётся через несколько часов!
                </p>
                <p className="text-sm text-ui-text-muted">
                  Добавь ситуацию или пройди кейс, чтобы сохранить серию.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setIsEntryModalOpen(true)}
                    className="px-3 py-1.5 bg-catalyst-gold hover:bg-catalyst-gold/90 text-white rounded text-sm transition-colors"
                  >
                    + Ситуация
                  </button>
                  <Link
                    href="/experiments?tab=cases"
                    className="px-3 py-1.5 bg-obsidian-core border border-ui-border-soft rounded text-sm text-ash-light hover:bg-graphite-structure transition-colors"
                  >
                    Кейс
                  </Link>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {/* Что нового */}
        {latestChanges.length > 0 && (
          <section className="bg-graphite-structure border border-ui-border-soft rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔔</span>
              <h2 className="text-sm font-semibold text-ash-light">Что нового</h2>
            </div>
            <div className="space-y-2">
              {latestChanges.map((change, index) => (
                <div 
                  key={`${change.nodeId}-${index}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <span>
                    {change.changeType === 'available' && '✅'}
                    {change.changeType === 'integrated' && '🔗'}
                  </span>
                  <span className="text-ui-text-muted">
                    {change.changeType === 'available' && 'Стала доступна: '}
                    {change.changeType === 'integrated' && 'Интегрируется: '}
                  </span>
                  <Link 
                    href={`/architecture?node=${change.nodeId}`}
                    className="text-ash-light hover:text-strategic-blue transition-colors"
                  >
                    {change.nodeName}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Быстрые действия */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-ui-text-muted mb-3">Быстрые действия</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setIsEntryModalOpen(true)}
              className="bg-graphite-structure border border-ui-border-soft rounded-xl p-4 text-center hover:border-system-focus hover:bg-obsidian-core transition-colors group"
            >
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📝</span>
              <span className="text-sm text-ash-light">Новая ситуация</span>
            </button>
            <Link
              href="/experiments?tab=cases"
              className="bg-graphite-structure border border-ui-border-soft rounded-xl p-4 text-center hover:border-system-focus hover:bg-obsidian-core transition-colors group"
            >
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">📊</span>
              <span className="text-sm text-ash-light">Кейс</span>
            </Link>
            <Link
              href="/architecture"
              className="bg-graphite-structure border border-ui-border-soft rounded-xl p-4 text-center hover:border-system-focus hover:bg-obsidian-core transition-colors group"
            >
              <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🌳</span>
              <span className="text-sm text-ash-light">Моё дерево</span>
            </Link>
          </div>
        </section>

        {/* Активные билды (если есть) */}
        {activeBuilds.length > 0 && (
          <section className="bg-graphite-structure border border-ui-border-soft rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-ash-light">Активные стили</h2>
              <Link href="/architecture?tab=styles" className="text-xs text-strategic-blue hover:underline">
                Все →
              </Link>
            </div>
            <div className="flex gap-2 flex-wrap">
              {activeBuilds.slice(0, 3).map((build: any) => (
                <div
                  key={build.build_id}
                  className="flex items-center gap-2 px-3 py-2 bg-obsidian-core rounded-xl"
                  style={{ borderLeft: `3px solid ${build.color || '#3A6F8F'}` }}
                >
                  <span className="text-lg">{build.icon}</span>
                  <span className="text-sm text-ash-light">{build.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Модальное окно добавления ситуации */}
        <AddSituationModal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          onSave={handleSaveSituation}
          isLoading={isSaving}
        />

        {/* Модальное окно добавления рефлексии */}
        <AddEvidenceModal
          isOpen={isEvidenceModalOpen}
          onClose={() => setIsEvidenceModalOpen(false)}
          onSave={handleSaveEvidence}
          isLoading={isSaving}
          questId={currentFocus?.type === 'quest' ? currentFocus.data.id : undefined}
          questTitle={currentFocus?.type === 'quest' ? currentFocus.data.title : undefined}
        />
      </div>

      {/* Попап достижений */}
      <AchievementPopup
        achievement={newAchievement}
        onClose={() => setNewAchievement(null)}
      />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
