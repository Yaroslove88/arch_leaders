'use client';

import { IconLoader } from './IconLoader';

// UI иконки
export type UIIconName = 
  | 'tree'
  | 'quest'
  | 'case'
  | 'situation'
  | 'trace'
  | 'streak'
  | 'achievement'
  | 'level-up';

// Иконки веток
export type BranchIconName =
  | 'subjectivity'
  | 'architectural-thinking'
  | 'responsibility'
  | 'environment-maturity'
  | 'resilience'
  | 'feedback';

// Иконки квестов
export type QuestIconName =
  | 'quest-default'
  | 'quest-micro'
  | 'quest-weekly'
  | 'quest-story';

// Иконки кейсов
export type CaseIconName = 'case-default';

// Иконки стилей лидерства
export type BuildIconName = 'architect' | 'strategist';

// Иконки действий
export type ActionIconName = 'add-situation' | 'add-evidence' | 'reflection';

// Иконки статусов
export type StatusIconName =
  | 'backlog'
  | 'active'
  | 'done'
  | 'archived';

// Иконки элементов системы
export type SystemIconName =
  | 'situations'
  | 'quests'
  | 'cases'
  | 'experiments'
  | 'traces'
  | 'analysis'
  | 'practice';

export type IconName = UIIconName | BranchIconName | QuestIconName | CaseIconName | BuildIconName | ActionIconName | StatusIconName | SystemIconName;

interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

// Маппинг иконок к путям файлов
const iconPaths: Record<IconName, string> = {
  // UI иконки
  'tree': '/icons/ui/tree.svg',
  'quest': '/icons/ui/quest.svg',
  'case': '/icons/ui/case.svg',
  'situation': '/icons/ui/situation.svg',
  'trace': '/icons/ui/trace.svg',
  'streak': '/icons/ui/streak.svg',
  'achievement': '/icons/ui/achievement.svg',
  'level-up': '/icons/ui/level-up.svg',
  
  // Иконки веток
  'subjectivity': '/icons/branches/subjectivity.svg',
  'architectural-thinking': '/icons/branches/architectural-thinking.svg',
  'responsibility': '/icons/branches/responsibility.svg',
  'environment-maturity': '/icons/branches/environment-maturity.svg',
  'resilience': '/icons/branches/resilience.svg',
  'feedback': '/icons/branches/feedback.svg',
  
  // Иконки квестов
  'quest-default': '/icons/quests/quest-default.svg',
  'quest-micro': '/icons/quests/quest-micro.svg',
  'quest-weekly': '/icons/quests/quest-weekly.svg',
  'quest-story': '/icons/quests/quest-story.svg',
  
  // Иконки кейсов
  'case-default': '/icons/cases/case-default.svg',
  
  // Иконки стилей лидерства
  'architect': '/icons/builds/architect.svg',
  'strategist': '/icons/builds/strategist.svg',
  
  // Иконки действий
  'add-situation': '/icons/actions/add-situation.svg',
  'add-evidence': '/icons/actions/add-evidence.svg',
  'reflection': '/icons/actions/reflection.svg',
  
  // Иконки статусов
  'backlog': '/icons/statuses/backlog.svg',
  'active': '/icons/statuses/active.svg',
  'done': '/icons/statuses/done.svg',
  'archived': '/icons/statuses/archived.svg',
  
  // Иконки элементов системы
  'situations': '/icons/system/situations.svg',
  'quests': '/icons/system/quests.svg',
  'cases': '/icons/system/cases.svg',
  'experiments': '/icons/system/experiments.svg',
  'traces': '/icons/system/traces.svg',
  'analysis': '/icons/system/analysis.svg',
  'practice': '/icons/system/practice.svg',
};

/**
 * Компонент иконки
 * Использует SVG файлы из public/icons
 * Поддерживает все иконки проекта: UI, ветки, квесты, кейсы, стили лидерства, действия, статусы, элементы системы
 * SVG встраиваются напрямую для поддержки currentColor из дизайн-системы
 */
export function Icon({ name, size = 'md', className }: IconProps) {
  const iconPath = iconPaths[name];
  
  if (!iconPath) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(iconPaths));
    }
    return null;
  }
  
  return (
    <IconLoader 
      iconPath={iconPath} 
      size={size} 
      className={className}
    />
  );
}
