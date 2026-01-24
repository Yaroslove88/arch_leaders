'use client';

import { useState, useEffect } from 'react';

interface TooltipStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const DEFAULT_STEPS: TooltipStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать! 👋',
    description: 'Это ваш главный экран. Здесь вы увидите активные квесты, прогресс и последние действия.',
  },
  {
    id: 'quests',
    title: 'Квесты — ваш путь развития 🎯',
    description: 'Выполняйте квесты, чтобы развивать лидерские способности. Мы уже активировали первый квест для вас!',
  },
  {
    id: 'traces',
    title: 'Журнал ситуаций 📝',
    description: 'Записывайте рабочие ситуации — система проанализирует их и предложит новые квесты.',
  },
  {
    id: 'tree',
    title: 'Дерево способностей 🌳',
    description: 'Изучите своё дерево способностей. Выполняйте квесты, чтобы открывать новые узлы.',
  },
];

interface OnboardingTooltipsProps {
  /** Override default steps */
  steps?: TooltipStep[];
  /** Called when onboarding is dismissed */
  onComplete?: () => void;
  /** Storage key for persistence */
  storageKey?: string;
}

export function OnboardingTooltips({
  steps = DEFAULT_STEPS,
  onComplete,
  storageKey = 'dashboard_onboarding_completed',
}: OnboardingTooltipsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if onboarding was already completed
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey);
      if (!completed) {
        // Small delay to let the page render first
        const timer = setTimeout(() => setIsVisible(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={handleDismiss}
      />
      
      {/* Tooltip card */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-graphite-structure border border-strategic-blue/30 rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress indicator */}
          <div className="flex gap-1 p-3 bg-obsidian-core">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-strategic-blue' : 'bg-ui-border-soft'
                }`}
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-bold text-ash-light mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-ui-text-muted leading-relaxed">
              {step.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between p-4 bg-obsidian-core border-t border-ui-border-soft">
            <button
              onClick={handleDismiss}
              className="text-sm text-ui-text-dim hover:text-ui-text-muted transition-colors"
            >
              Пропустить
            </button>
            
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-sm text-ui-text-muted hover:text-ash-light transition-colors"
                >
                  Назад
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-strategic-blue text-white text-sm rounded-lg hover:bg-strategic-blue/90 transition-colors font-medium"
              >
                {currentStep < steps.length - 1 ? 'Далее' : 'Начать'}
              </button>
            </div>
          </div>
          
          {/* Step counter */}
          <div className="text-center py-2 text-xs text-ui-text-dim bg-obsidian-core">
            {currentStep + 1} / {steps.length}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook to check if dashboard onboarding should be shown
 */
export function useShouldShowOnboarding(storageKey = 'dashboard_onboarding_completed'): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(storageKey);
      setShouldShow(!completed);
    }
  }, [storageKey]);

  return shouldShow;
}

export default OnboardingTooltips;
