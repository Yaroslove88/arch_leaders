/**
 * ЦЕНТРАЛИЗОВАННЫЙ ФАЙЛ ПЕРЕВОДОВ НАЗВАНИЙ УЗЛОВ
 * 
 * ⚠️ ВАЖНО: Это единственный источник истины для переводов названий узлов.
 * Все переводы узлов в проекте должны браться из этого файла.
 * 
 * Правила использования:
 * 1. Всегда используйте функцию getNodeName() из этого файла
 * 2. НЕ создавайте локальные nodeNameMap в других файлах
 * 3. При добавлении новых узлов - добавляйте их сюда
 * 4. При изменении переводов - меняйте только здесь
 */

import { NodeDescription } from './api';

/**
 * Маппинг node_id -> русское название узла
 * Это основной источник переводов для узлов по их ID
 */
export const NODE_NAME_MAP: Record<string, string> = {
  // Архитектурные узлы
  'node_grounding_point': 'Точка опоры',
  'node_self_regulation': 'Саморегуляция',
  'node_role_differentiation': 'Различение ролей',
  'node_scenario_analysis': 'Разбор сценария',
  'node_scenario_breakdown': 'Разбор сценария',
  'node_subject_in_system': 'Субъект в системе',
  'node_decision_authorship': 'Авторство решений',
  'node_difference_field': 'Поле различий',
  'node_architecture_coupling': 'Архитектура сцепки',
  'node_field_of_differences': 'Поле различий',
  'node_system_thinking': 'Системное мышление',
  'node_scenario_thinking': 'Сценарное мышление',
  'node_form_assembly': 'Сборка форм',
  'node_containment': 'Контейнирование',
  'node_thinking_through_form': 'Мышление через форму',
  'node_let_it_break': 'Разрешить системе ошибиться',
  'node_rule_creation': 'Создание правил',
  
  // Узлы личной устойчивости
  'node_personal_resilience': 'Личная устойчивость',
  'node_weak_zone_diagnosis': 'Диагностика слабых зон',
  'node_recovery_skills': 'Навыки восстановления',
  'node_emotional_work': 'Работа с эмоциями',
  'node_cognitive_maturity': 'Когнитивная зрелость',
  'node_role_energy': 'Энергия роли',
  'node_stress_tolerance': 'Толерантность к стрессу',
  'node_recovery': 'Восстановление',
  
  // Узлы ответственности и делегирования
  'node_responsibility_as_form': 'Ответственность как форма',
  'node_responsibility_sag_diagnosis': 'Диагностика провисания ответственности',
  'node_delegation_as_coupling': 'Делегирование как сцепка',
  'node_upper_field_work': 'Работа с верхним полем',
  'node_leader_liberation': 'Освобождение лидера',
  
  // Узлы лидерства
  'node_shared_leadership': 'Распределённое лидерство',
  'node_psychological_ownership': 'Психологическая собственность',
  'node_collective_efficacy': 'Коллективная эффективность',
  'node_ownership': 'Владение',
  'node_accountability': 'Подотчетность',
  
  // Узлы обратной связи
  'node_feedback_types': 'Типы обратной связи',
  'node_language_of_differences': 'Язык различий',
  'node_feedback_through_vulnerability': 'Приём обратной связи через уязвимость',
  'node_feedforward': 'Обратная связь в будущее',
  'node_rede_model': 'REDE Модель',
  'node_mirror_holder': 'Смотрящий в окно vs Держащий зеркало',
  'node_giving_feedback': 'Дача обратной связи',
  'node_receiving_feedback': 'Принятие обратной связи',
  
  // Узлы развития
  'node_maturity_environment': 'Среда зрелости',
  'node_subjectivity_transfer': 'Передача субъектности',
  'node_scene_holding': 'Удержание сцены',
  'node_institutionalization': 'Институционализация',
  'node_vertical_development': 'Вертикальное развитие',
  'node_ddo': 'Организация как тренажёр',
  'node_organization_as_trainer': 'Организация как тренажёр',
  'node_mature_parting': 'Зрелое расставание',
  'node_team_development': 'Развитие команды',
  'node_organizational_culture': 'Организационная культура',
  
  // Другие узлы
  'node_grounding': 'Заземление',
  'node_design_thinking': 'Дизайн-мышление',
};

/**
 * Маппинг английских названий узлов -> русские названия
 * Используется для перевода названий, которые приходят из API
 */
export const NODE_NAME_TRANSLATIONS: Record<string, string> = {
  'REDE Model': 'REDE Модель',
  'Deliberately Developmental Organization': 'Организация как тренажёр',
  'DDO': 'Организация как тренажёр',
  'Vertical Development': 'Вертикальное развитие',
  'Shared Leadership': 'Распределённое лидерство',
  'Distributed Leadership': 'Распределённое лидерство',
  'Feedforward': 'Обратная связь в будущее',
  'Window Gazer vs Mirror Holder': 'Смотрящий в окно vs Держащий зеркало',
};

/**
 * Переводит английское название узла в русское
 * @param name - английское название узла
 * @returns русское название узла
 */
export function translateNodeName(name: string): string {
  // Проверяем точное совпадение
  if (NODE_NAME_TRANSLATIONS[name]) {
    return NODE_NAME_TRANSLATIONS[name];
  }
  
  // Проверяем частичное совпадение (для случаев, когда название входит в состав другого текста)
  for (const [english, russian] of Object.entries(NODE_NAME_TRANSLATIONS)) {
    if (name.includes(english)) {
      return name.replace(english, russian);
    }
  }
  
  return name;
}

/**
 * Получает русское название узла по его node_id
 * 
 * Приоритет получения названия:
 * 1. Из nodeDescriptions (если передан) - использует translateNodeName для перевода
 * 2. Из NODE_NAME_MAP (статический маппинг)
 * 3. Fallback: преобразование node_id в читаемый формат
 * 
 * @param nodeId - идентификатор узла (например, 'node_difference_field')
 * @param nodeDescriptions - опциональный объект с описаниями узлов из API (может быть полным NodeDescription или только с name)
 * @returns русское название узла
 */
export function getNodeName(
  nodeId: string, 
  nodeDescriptions?: Record<string, NodeDescription | { name: string }>
): string {
  // 1. Сначала пробуем получить из загруженных описаний (приоритет API)
  if (nodeDescriptions?.[nodeId]?.name) {
    return translateNodeName(nodeDescriptions[nodeId].name);
  }
  
  // 2. Затем из статического маппинга
  if (NODE_NAME_MAP[nodeId]) {
    return NODE_NAME_MAP[nodeId];
  }
  
  // 3. Fallback: преобразуем node_id в читаемый формат
  const fallbackName = nodeId
    .replace(/^node_/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return translateNodeName(fallbackName);
}
