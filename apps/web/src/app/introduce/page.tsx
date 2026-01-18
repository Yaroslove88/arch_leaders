'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Компонент индикатора прогресса
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            index < currentStep
              ? 'bg-strategic-blue'
              : index === currentStep
              ? 'bg-strategic-blue'
              : 'bg-ui-border-soft'
          }`}
        />
      ))}
    </div>
  );
}

// Шаг 1: Приветствие автора
function Step1() {
  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-strategic-blue/30 bg-obsidian-core flex items-center justify-center">
          <span className="text-5xl">👋</span>
        </div>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-ash-light">
        Привет! Я — Ярослав
      </h2>
      
      <p className="text-lg text-ash-light leading-relaxed max-w-lg mx-auto">
        Эта система — мой способ передать опыт архитектурного лидерства. 
        Не через лекции, а через практику.
      </p>
    </div>
  );
}

// Шаг 2: Что такое архитектурное лидерство
function Step2() {
  return (
    <div className="text-center">
      <div className="text-5xl mb-6">🏗️</div>
      
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-ash-light">
        Что такое архитектурное лидерство?
      </h2>
      
      <p className="text-base text-ui-text-muted mb-8 max-w-lg mx-auto">
        Это не управление задачами. Это способность создавать:
      </p>
      
      <div className="space-y-4 max-w-md mx-auto text-left">
        <div className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
          <span className="text-2xl">🔗</span>
          <div>
            <h4 className="font-semibold text-ash-light">Связи между людьми</h4>
            <p className="text-sm text-ui-text-muted">Доверие, взаимность, направление</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
          <span className="text-2xl">🧱</span>
          <div>
            <h4 className="font-semibold text-ash-light">Формы для взаимодействий</h4>
            <p className="text-sm text-ui-text-muted">Процессы, которые работают без вас</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-obsidian-core rounded-lg">
          <span className="text-2xl">🌱</span>
          <div>
            <h4 className="font-semibold text-ash-light">Среду для роста</h4>
            <p className="text-sm text-ui-text-muted">Где люди развиваются сами</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Шаг 3: Дерево способностей
function Step3() {
  const branches = [
    { emoji: '🧠', name: 'Субъектность' },
    { emoji: '🧱', name: 'Арх. мышление' },
    { emoji: '⚖️', name: 'Ответственность' },
    { emoji: '🌱', name: 'Среда зрелости' },
    { emoji: '⚡', name: 'Устойчивость' },
    { emoji: '🔄', name: 'Обратная связь' },
  ];

  return (
    <div className="text-center">
      <div className="text-5xl mb-6">🌳</div>
      
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-ash-light">
        Дерево способностей
      </h2>
      
      <p className="text-base text-ui-text-muted mb-8 max-w-lg mx-auto">
        40 узлов в 6 ветках — карта твоего развития как лидера
      </p>
      
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {branches.map((branch, index) => (
          <div key={index} className="flex flex-col items-center p-3 bg-obsidian-core rounded-lg">
            <span className="text-2xl mb-1">{branch.emoji}</span>
            <span className="text-xs text-ui-text-muted text-center">{branch.name}</span>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-ui-text-dim mt-6">
        Базовые узлы уже открыты. Растёшь — открываешь новые.
      </p>
    </div>
  );
}

// Шаг 4: Цикл развития
function Step4() {
  const steps = [
    { emoji: '📝', label: 'Ситуация' },
    { emoji: '🤖', label: 'Анализ' },
    { emoji: '🧪', label: 'Эксперимент' },
    { emoji: '🔍', label: 'Следы' },
    { emoji: '✨', label: 'Рост' },
  ];

  return (
    <div className="text-center">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-ash-light">
        Как это работает?
      </h2>
      
      <div className="flex flex-wrap justify-center items-center gap-2 mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center p-2 bg-obsidian-core rounded-lg min-w-[60px]">
              <span className="text-2xl">{step.emoji}</span>
              <span className="text-xs text-ui-text-muted mt-1">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <span className="text-ui-text-dim mx-1">→</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="space-y-3 max-w-md mx-auto text-left">
        <p className="text-sm text-ui-text-muted">
          <strong className="text-ash-light">1.</strong> Описываешь реальную ситуацию из работы
        </p>
        <p className="text-sm text-ui-text-muted">
          <strong className="text-ash-light">2.</strong> Система анализирует паттерны и зоны роста
        </p>
        <p className="text-sm text-ui-text-muted">
          <strong className="text-ash-light">3.</strong> Выбираешь квест или кейс для практики
        </p>
        <p className="text-sm text-ui-text-muted">
          <strong className="text-ash-light">4.</strong> Фиксируешь результаты и инсайты
        </p>
        <p className="text-sm text-ui-text-muted">
          <strong className="text-ash-light">5.</strong> Получаешь XP, разблокируешь способности
        </p>
      </div>
    </div>
  );
}

// Шаг 5: Твой первый шаг
function Step5() {
  return (
    <div className="text-center">
      <div className="text-5xl mb-6">🚀</div>
      
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-ash-light">
        Твой первый шаг
      </h2>
      
      <p className="text-base text-ui-text-muted mb-8 max-w-lg mx-auto">
        Опиши ситуацию из работы или жизни. Система проанализирует её и предложит путь развития. 
        Не нужно готовиться — просто расскажи, что происходит.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <Link
          href="/traces"
          className="flex-1 bg-strategic-blue hover:bg-strategic-blue/90 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
        >
          Создать ситуацию
        </Link>
        <Link
          href="/architecture"
          className="flex-1 bg-obsidian-core hover:bg-bg-panel border border-ui-border-soft text-ash-light font-medium py-4 px-6 rounded-lg text-center transition-colors"
        >
          Посмотреть дерево
        </Link>
      </div>
    </div>
  );
}

export default function IntroducePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 5;

  const steps = [Step1, Step2, Step3, Step4, Step5];
  const CurrentStepComponent = steps[currentStep];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Последний шаг - завершаем онбординг
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasSeenIntroduce', 'true');
      }
      router.push('/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Сохраняем флаг, что пользователь видел онбординг
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSeenIntroduce', 'true');
    }
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-bg-main flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Заголовок шага и кнопка пропуска */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm text-ui-text-muted">
              Шаг {currentStep + 1} из {totalSteps}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-ui-text-dim hover:text-ui-text-muted transition-colors"
            >
              Пропустить
            </button>
          </div>

          {/* Контент шага */}
          <div className="bg-bg-panel border border-ui-border-soft rounded-xl p-8 md:p-12 min-h-[400px] flex flex-col justify-center">
            <CurrentStepComponent />
          </div>

          {/* Навигация */}
          <div className="mt-8 flex flex-col items-center gap-6">
            {/* Кнопки навигации */}
            <div className="flex gap-4 w-full max-w-xs">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 px-6 border border-ui-border-soft rounded-lg text-ash-light hover:bg-obsidian-core transition-colors"
                >
                  ← Назад
                </button>
              )}
              {currentStep < totalSteps - 1 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 px-6 bg-strategic-blue hover:bg-strategic-blue/90 text-white rounded-lg font-medium transition-colors"
                >
                  Далее →
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 px-6 bg-strategic-blue hover:bg-strategic-blue/90 text-white rounded-lg font-medium transition-colors"
                >
                  Начать →
                </button>
              )}
            </div>

            {/* Индикатор прогресса */}
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
          </div>
        </div>
      </div>
    </main>
  );
}
