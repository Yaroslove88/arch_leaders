'use client';

export function AdminAnalytics() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ui-text-main mb-6">Аналитика продукта</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Активность пользователей</h3>
          <p className="text-ui-text-muted text-sm">
            Метрики по активности пользователей, сессиям, квестам
          </p>
        </div>

        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Конверсии</h3>
          <p className="text-ui-text-muted text-sm">
            Анализ конверсий по этапам пользовательского пути
          </p>
        </div>

        <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-ui-text-main mb-2">Эффективность квестов</h3>
          <p className="text-ui-text-muted text-sm">
            Статистика по завершению квестов и прогрессу
          </p>
        </div>
      </div>

      <div className="bg-bg-panel border border-ui-border-soft rounded-lg p-6">
        <h3 className="text-lg font-semibold text-ui-text-main mb-4">Доступные метрики</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-ui-text-muted">
          <div>
            <div className="font-semibold text-ui-text-main mb-2">Пользователи</div>
            <ul className="space-y-1">
              <li>• Регистрации по дням/неделям</li>
              <li>• Активные пользователи (DAU/WAU/MAU)</li>
              <li>• Retention cohorts</li>
              <li>• Последняя активность</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ui-text-main mb-2">Контент</div>
            <ul className="space-y-1">
              <li>• Количество entries по типам</li>
              <li>• Успешность анализа сессий</li>
              <li>• Среднее время обработки</li>
              <li>• Ошибки анализа</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ui-text-main mb-2">Квесты</div>
            <ul className="space-y-1">
              <li>• Активные квесты</li>
              <li>• Процент завершения</li>
              <li>• Среднее время выполнения</li>
              <li>• Популярные типы квестов</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ui-text-main mb-2">Способности</div>
            <ul className="space-y-1">
              <li>• Разблокированные узлы</li>
              <li>• Прогресс по веткам</li>
              <li>• Интеграция способностей</li>
              <li>• Распределение по уровням</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
