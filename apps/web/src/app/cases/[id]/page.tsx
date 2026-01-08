'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCase, InteractiveCase } from '@/lib/api';

// Маппинг названий навыков на русский язык
const skillTranslations: Record<string, string> = {
  'Direct Order': 'Прямое распоряжение',
  'Context Share': 'Передача контекста',
  'Let It Break': 'Разрешить системе ошибиться',
  'Let It Break + Containment': 'Разрешить системе ошибиться + Контейнирование',
  'Containment': 'Контейнирование',
  'Rule Creation': 'Создание правил',
  'Avoidance': 'Избегание',
  'Hero Mode': 'Режим героя',
  'Delegation': 'Делегирование',
  'Delegation with Risk': 'Делегирование с риском',
  'Delay': 'Отсрочка',
  'Intuitive Decision': 'Интуитивное решение',
  'Subjectivity': 'Субъектность',
  'Scenario Thinking': 'Сценарное мышление',
  'Firefighting': 'Тушение пожаров',
};

function translateSkill(skill?: string): string | null {
  if (!skill) return null;
  return skillTranslations[skill] || skill;
}

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const [case_, setCase] = useState<InteractiveCase | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showConsequences, setShowConsequences] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadCase(params.id as string);
    }
  }, [params.id]);

  async function loadCase(id: string) {
    setLoading(true);
    try {
      const data = await getCase(id);
      setCase(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }

  function handleOptionSelect(optionId: string) {
    setSelectedOption(optionId);
    setShowConsequences(true);
  }

  function handleReset() {
    setSelectedOption(null);
    setShowConsequences(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-ui-text-muted">Загрузка кейса...</div>
        </div>
      </main>
    );
  }

  if (!case_) {
    return (
      <main className="min-h-screen bg-bg-main p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-system-critical">Кейс не найден</div>
        </div>
      </main>
    );
  }

  const selectedOptionData = case_.options.find((opt) => opt.id === selectedOption);

  return (
    <main className="min-h-screen bg-bg-main p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-system-focus hover:text-system-focus/80 transition-colors"
        >
          ← Назад к кейсам
        </button>

        <section className="bg-bg-panel border border-ui-border-soft rounded-lg shadow-panel p-8">
          <h1 className="text-3xl font-bold mb-4 text-ui-text-main">{case_.title}</h1>

          {/* Контекст */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-ui-text-main">Ситуация</h2>
            <p className="text-ui-text-main whitespace-pre-line">{case_.context}</p>
          </div>


          {/* Варианты действий */}
          {!showConsequences && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Варианты действий</h2>
              <div className="space-y-3">
                {case_.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className="w-full p-4 text-left bg-bg-secondary border-2 border-ui-border-soft rounded-lg hover:border-system-focus hover:bg-bg-hover transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel"
                  >
                    <div className="flex items-start">
                      <span className="text-ui-text-main">{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Последствия */}
          {showConsequences && selectedOptionData && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-ui-text-main">Последствия выбора</h2>
              <div className="bg-bg-secondary border-l-4 border-system-warning p-4 mb-4 rounded-r">
                <p className="font-semibold mb-2 text-ui-text-main">Вы выбрали: {selectedOptionData.text}</p>
                {selectedOptionData.skill_used && translateSkill(selectedOptionData.skill_used) && (
                  <p className="text-base font-semibold text-system-focus mt-2">
                    Навык: {translateSkill(selectedOptionData.skill_used)}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-bg-secondary border border-system-critical rounded-lg">
                  <h3 className="font-semibold text-system-critical mb-2">Немедленный эффект:</h3>
                  <p className="text-sm text-ui-text-main">{selectedOptionData.consequence.immediate}</p>
                </div>

                <div className="p-4 bg-bg-secondary border border-system-warning rounded-lg">
                  <h3 className="font-semibold text-system-warning mb-2">Вторичный эффект:</h3>
                  <p className="text-sm text-ui-text-main">{selectedOptionData.consequence.second_order}</p>
                </div>

                <div className="p-4 bg-bg-secondary border border-system-stable rounded-lg">
                  <h3 className="font-semibold text-system-stable mb-2">Системный эффект:</h3>
                  <p className="text-sm text-ui-text-main">{selectedOptionData.consequence.systemic}</p>
                </div>

                {selectedOptionData.sm_impact && (
                  <div className="p-4 bg-bg-secondary border border-system-focus rounded-lg">
                    <h3 className="font-semibold text-system-focus mb-2">Влияние на зрелость:</h3>
                    <p className="text-sm text-ui-text-muted">
                      Ваш выбор влияет на развитие лидерских качеств. Обратите внимание на последствия вашего решения.
                    </p>
                  </div>
                )}

                {selectedOptionData.explanation && (
                  <div className="p-4 bg-bg-secondary border border-system-growth rounded-lg">
                    <p className="text-sm text-ui-text-main">{selectedOptionData.explanation}</p>
                  </div>
                )}

                {selectedOptionData.warning && (
                  <div className="p-4 bg-bg-secondary border border-system-critical rounded-lg">
                    <p className="text-sm text-system-critical">⚠️ {selectedOptionData.warning}</p>
                  </div>
                )}
              </div>

              {/* Рефлексия */}
              {case_.reflection && (
                <div className="mt-6 p-4 bg-bg-secondary border border-ui-border-soft rounded-lg">
                  <h3 className="font-semibold mb-3 text-ui-text-main">Вопросы для рефлексии:</h3>
                  <ul className="space-y-2">
                    {case_.reflection.questions.map((question, idx) => (
                      <li key={idx} className="text-sm text-ui-text-main">
                        • {question}
                      </li>
                    ))}
                  </ul>
                  {case_.reflection.mirror && selectedOption && (
                    <div className="mt-4 p-3 bg-bg-panel rounded border border-ui-border-soft">
                      <p className="text-sm font-semibold mb-1 text-ui-text-main">Зеркало:</p>
                      <p className="text-sm text-ui-text-muted">{case_.reflection.mirror[selectedOption]}</p>
                    </div>
                  )}
                  {case_.reflection.key_insight && (
                    <div className="mt-4 p-3 bg-bg-panel border border-system-focus rounded">
                      <p className="text-sm font-semibold mb-1 text-ui-text-main">Ключевой инсайт:</p>
                      <p className="text-sm text-ui-text-muted">{case_.reflection.key_insight}</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleReset}
                className="mt-6 px-6 py-2 bg-system-focus text-ui-text-main rounded hover:bg-system-focus/80 transition-colors focus:ring-2 focus:ring-system-focus focus:ring-offset-2 focus:ring-offset-bg-panel"
              >
                Выбрать другой вариант
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

