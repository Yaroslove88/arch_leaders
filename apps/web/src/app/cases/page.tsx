'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCases, getCasesByBranch, InteractiveCase } from '@/lib/api';

export default function CasesPage() {
  const [cases, setCases] = useState<InteractiveCase[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, [selectedBranch]);

  async function loadCases() {
    setLoading(true);
    setError(null);
    try {
      const data = selectedBranch
        ? await getCasesByBranch(selectedBranch)
        : await getCases();
      setCases(data.cases || []);
    } catch (error: any) {
      setError(error?.message || 'Не удалось загрузить кейсы. Проверьте, что API сервер запущен.');
    } finally {
      setLoading(false);
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-bg-secondary border-system-growth/30 text-system-growth';
      case 'intermediate':
        return 'bg-bg-secondary border-system-warning/30 text-system-warning';
      case 'advanced':
        return 'bg-bg-secondary border-system-critical/30 text-system-critical';
      default:
        return 'bg-bg-secondary border-ui-border-soft text-ui-text-muted';
    }
  };

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
            {cases.map((case_) => (
              <Link
                key={case_.id}
                href={`/cases/${case_.id}`}
                className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-6 border-l-4 border-system-stable hover:shadow-active transition-shadow bg-panel-gradient"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-ui-text-main">{case_.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(case_.difficulty)}`}>
                    {case_.difficulty === 'basic' ? 'Базовый' : 
                     case_.difficulty === 'intermediate' ? 'Средний' : 
                     case_.difficulty === 'advanced' ? 'Продвинутый' : case_.difficulty}
                  </span>
                </div>
                <p className="text-sm text-ui-text-muted mb-4 line-clamp-3">{case_.context}</p>


                <div className="text-sm text-system-focus hover:text-system-focus/80 hover:underline">
                  Пройти кейс →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

