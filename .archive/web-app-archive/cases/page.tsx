'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCases, getCasesByBranch, getCaseProgress, InteractiveCase } from '@/lib/api';
import { CaseCard, type CaseDifficulty, type CaseStatus } from '@/components/cards';

export default function CasesPage() {
  const [cases, setCases] = useState<InteractiveCase[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseProgress, setCaseProgress] = useState<{ solvedCases: string[], nodeProgress: Record<string, any> }>({ solvedCases: [], nodeProgress: {} });

  useEffect(() => {
    loadCases();
  }, [selectedBranch]);

  async function loadCases() {
    setLoading(true);
    setError(null);
    try {
      const [casesData, progressData] = await Promise.all([
        selectedBranch ? getCasesByBranch(selectedBranch) : getCases(),
        getCaseProgress().catch(() => ({ solvedCases: [], nodeProgress: {} })),
      ]);
      setCases(casesData.cases || []);
      setCaseProgress(progressData);
    } catch (error: any) {
      setError(error?.message || 'Не удалось загрузить кейсы. Проверьте, что API сервер запущен.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка кейсов...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-bg-panel border border-system-critical/30 rounded-lg p-6 shadow-panel">
            <h2 className="text-xl font-semibold text-system-critical mb-2">Ошибка загрузки</h2>
            <p className="text-ui-text-muted">{error}</p>
            <button
              onClick={() => loadCases()}
              className="mt-4 px-4 py-2 bg-bg-secondary border border-system-critical text-system-critical rounded hover:border-system-critical/70 hover:bg-bg-panel transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-ui-text-main">Интерактивные кейсы</h1>
          <Link
            href="/tree"
            className="px-4 py-2 bg-bg-secondary border border-system-focus text-system-focus rounded hover:border-system-focus/70 hover:bg-bg-panel transition-colors"
          >
            Дерево способностей
          </Link>
        </div>

        <p className="text-ui-text-muted mb-6">
          Практикуйтесь в принятии решений в безопасной среде. Каждый кейс содержит ситуацию,
          варианты действий и последствия вашего выбора.
        </p>

        {/* Фильтр по веткам */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-ui-text-main mb-2">
            Фильтр по ветке:
          </label>
          <select
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(e.target.value || null)}
            className="px-4 py-2 bg-bg-secondary border border-ui-border-soft rounded-lg text-ui-text-main focus:outline-none focus:ring-2 focus:ring-system-focus focus:border-system-focus"
          >
            <option value="">Все ветки</option>
            <option value="branch_subjectivity">Субъектность</option>
            <option value="branch_architectural_thinking">Архитектурное мышление</option>
            <option value="branch_resilience">Устойчивость</option>
            <option value="branch_responsibility">Ответственность</option>
            <option value="branch_feedback">Обратная связь</option>
            <option value="branch_maturity_environment">Среда зрелости</option>
          </select>
        </div>

        {/* Список кейсов */}
        {cases.length === 0 ? (
          <div className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-8 text-center text-ui-text-muted">
            Нет кейсов
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((case_) => {
              const isSolved = caseProgress.solvedCases.includes(case_.id);
              
              return (
                <CaseCard
                  key={case_.id}
                  caseId={case_.id}
                  title={case_.title}
                  event={case_.context?.split('\n')[0]?.slice(0, 150)}
                  difficulty={case_.difficulty as CaseDifficulty}
                  status={isSolved ? 'completed' : 'available'}
                  selectedPosition={isSolved ? 'A' : undefined}
                  treeImpact={case_.node_id ? [{
                    nodeName: case_.node_id,
                    percentage: 5
                  }] : undefined}
                  onClick={() => window.location.href = `/cases/${case_.id}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

