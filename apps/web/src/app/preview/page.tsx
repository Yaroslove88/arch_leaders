'use client';

import { useState } from 'react';
import {
  BranchCard,
  NodeCard,
  NodeDetailCard,
  QuestCard,
  QuestDetailCard,
  CaseCard,
  BuildCard,
} from '@/components/cards';
import {
  AddSituationModal,
  AddEvidenceModal,
  ReflectionModal,
} from '@/components/modals';
import { tokens } from '@leadership-architect/ui';
import { getBranchColorRaw } from '@/lib/ui-utils';

/**
 * Страница превью всех новых компонентов
 * Для демонстрации и тестирования дизайна
 */
export default function PreviewPage() {
  // Состояние модальных окон
  const [showSituationModal, setShowSituationModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);

  // Состояние детальных карточек
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);

  // Демо-данные для QuestDetailCard
  const [questSteps, setQuestSteps] = useState([
    { id: '1', title: 'Изучить теорию', description: 'Прочитайте статью о делегировании', isCompleted: true },
    { id: '2', title: 'Определить задачу', description: 'Выберите задачу для делегирования', isCompleted: true },
    { id: '3', title: 'Выбрать исполнителя', description: 'Найдите подходящего человека', isCompleted: false },
    { id: '4', title: 'Провести разговор', description: 'Обсудите задачу с исполнителем', isCompleted: false },
  ]);

  // Обработчик переключения шага
  const handleStepToggle = (stepId: string, isCompleted: boolean) => {
    setQuestSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, isCompleted } : step
      )
    );
  };

  return (
    <div className="min-h-screen bg-obsidian-core p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-ash-light mb-2">
          🎨 Превью компонентов
        </h1>
        <p className="text-sm text-ui-text-muted mb-8">
          Демонстрация новых карточек и модальных окон
        </p>

        {/* Секция: Карточки веток */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
            1. Карточки веток (BranchCard)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <BranchCard
              branchId="subjectness"
              name="Субъектность"
              description="Способность видеть и учитывать внутренний мир других людей, их мотивы и ограничения. Основа архитектурного лидерства."
              icon="🌿"
              progress={60}
              activeNodes={6}
              totalNodes={10}
              currentFocus="Удержание напряжения"
              onClick={() => alert('Открыть ветку Субъектность')}
            />
            <BranchCard
              branchId="architectural"
              name="Архитектурное мышление"
              description="Умение видеть систему целиком и проектировать решения, учитывающие все взаимосвязи."
              icon="🏗️"
              progress={30}
              activeNodes={3}
              totalNodes={10}
              recommendation="growing"
              onClick={() => alert('Открыть ветку')}
            />
            <BranchCard
              branchId="responsibility"
              name="Ответственность"
              description="Осознанное принятие последствий своих решений и действий."
              icon="⚖️"
              progress={20}
              activeNodes={2}
              totalNodes={10}
              recommendation="focus"
              onClick={() => alert('Открыть ветку')}
            />
          </div>
        </section>

        {/* Секция: Карточки узлов */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
            2. Карточки узлов (NodeCard)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <NodeCard
              nodeId="1"
              name="Удержание напряжения"
              branchName="Субъектность"
              level={3}
              progress={75}
              questsCount={2}
              casesCount={3}
              state="active"
              branchColor={getBranchColorRaw('subjectivity')}
              onClick={() => setSelectedNode('1')}
            />
            <NodeCard
              nodeId="2"
              name="Эмпатия"
              branchName="Субъектность"
              level={2}
              progress={50}
              questsCount={1}
              casesCount={2}
              state="available"
              branchColor={getBranchColorRaw('subjectivity')}
              onClick={() => setSelectedNode('2')}
            />
            <NodeCard
              nodeId="3"
              name="Системное видение"
              branchName="Архитектурное мышление"
              level={1}
              progress={25}
              state="unlocked"
              branchColor={getBranchColorRaw('architectural-thinking')}
              onClick={() => setSelectedNode('3')}
            />
            <NodeCard
              nodeId="4"
              name="Стратегическое планирование"
              state="locked"
              progress={0}
              requirements={['Системное видение (Ур. 2)', 'Анализ трейдоффов (Ур. 1)']}
              branchColor={getBranchColorRaw('architectural-thinking')}
            />
          </div>
        </section>

        {/* Секция: Детальная карточка узла */}
        {selectedNode && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
              2.1 Детальная карточка узла (NodeDetailCard)
            </h2>
            <NodeDetailCard
              nodeId={selectedNode}
              name="Удержание напряжения"
              description="Способность выдерживать дискомфорт неопределённости и не торопиться с решениями, давая ситуации развернуться."
              branchName="Субъектность"
              branchColor={getBranchColorRaw('subjectivity')}
              level={3}
              maxLevel={5}
              currentXP={150}
              requiredXP={200}
              state="active"
              quests={[
                { id: 'q1', title: 'Практика терпения', status: 'in_progress' },
                { id: 'q2', title: 'Наблюдение за командой', status: 'available' },
              ]}
              cases={[
                { id: 'c1', title: 'Конфликт в команде', status: 'completed' },
                { id: 'c2', title: 'Сложное решение', status: 'available' },
              ]}
              quickActions={[
                { id: 'a1', label: 'Добавить ситуацию', icon: '➕', onClick: () => setShowSituationModal(true) },
                { id: 'a2', label: 'Добавить след', icon: '📎', onClick: () => setShowEvidenceModal(true) },
              ]}
              onQuestClick={(id) => setSelectedQuest(id)}
              onCaseClick={(id) => alert(`Открыть кейс ${id}`)}
              onClose={() => setSelectedNode(null)}
            />
          </section>
        )}

        {/* Секция: Карточки квестов */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
            3. Карточки квестов (QuestCard)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuestCard
              questId="1"
              title="Практика делегирования"
              hypothesis="Если я научусь делегировать с контекстом, команда будет расти быстрее"
              questType="weekly"
              difficulty="intermediate"
              status="in_progress"
              completedSteps={2}
              totalSteps={4}
              xpReward={100}
              treeImpact={[{ nodeName: 'Субъектность', percentage: 15 }]}
              estimatedMinutes={30}
              onClick={() => setSelectedQuest('1')}
            />
            <QuestCard
              questId="2"
              title="Быстрая рефлексия"
              hypothesis="Регулярная рефлексия ускоряет обучение"
              questType="micro"
              difficulty="basic"
              status="available"
              completedSteps={0}
              totalSteps={2}
              xpReward={50}
              treeImpact={[{ nodeName: 'Обратная связь', percentage: 5 }]}
              estimatedMinutes={5}
              onClick={() => alert('Открыть квест')}
            />
            <QuestCard
              questId="3"
              title="Путь архитектора"
              hypothesis="Системное мышление — ключ к масштабированию"
              questType="story"
              difficulty="advanced"
              status="completed"
              completedSteps={6}
              totalSteps={6}
              xpReward={200}
              treeImpact={[{ nodeName: 'Архитектурное мышление', percentage: 25 }]}
              estimatedMinutes={60}
              onClick={() => alert('Открыть квест')}
            />
          </div>
        </section>

        {/* Секция: Детальная карточка квеста */}
        {selectedQuest && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
              3.1 Детальная карточка квеста (QuestDetailCard)
            </h2>
            <QuestDetailCard
              questId={selectedQuest}
              title="Практика делегирования"
              description="Научитесь эффективно делегировать задачи, сохраняя контроль и развивая команду."
              hypothesis="Если я научусь делегировать с контекстом, команда будет расти быстрее"
              theory="Делегирование — это не просто передача задач. Это инвестиция в развитие команды и освобождение своего времени для стратегических задач."
              questType="weekly"
              difficulty="intermediate"
              steps={questSteps}
              successCriteria={[
                { id: 'c1', text: 'Передал задачу с объяснением контекста', isCompleted: true },
                { id: 'c2', text: 'Не вмешивался в процесс выполнения', isCompleted: false },
                { id: 'c3', text: 'Записал результаты и инсайты', isCompleted: false },
              ]}
              treeImpact={[{ nodeName: 'Субъектность', percentage: 15 }]}
              xpReward={100}
              estimatedMinutes={30}
              onStepToggle={handleStepToggle}
              onComplete={() => {
                setShowReflectionModal(true);
              }}
              onClose={() => setSelectedQuest(null)}
            />
          </section>
        )}

        {/* Секция: Карточки кейсов */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
            4. Карточки кейсов (CaseCard)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CaseCard
              caseId="1"
              title="Конфликт приоритетов"
              event="Два важных проекта требуют одного и того же ресурса. Дедлайны горят!"
              difficulty="intermediate"
              status="available"
              treeImpact={[{ nodeName: 'Ответственность', percentage: 10 }]}
              onClick={() => alert('Открыть кейс')}
            />
            <CaseCard
              caseId="2"
              title="Сложный разговор"
              event="Нужно дать негативную обратную связь ценному сотруднику, который может уйти."
              difficulty="advanced"
              status="completed"
              selectedPosition="B"
              onClick={() => alert('Открыть кейс')}
            />
            <CaseCard
              caseId="3"
              title="Первое делегирование"
              event="Вам предстоит впервые делегировать важную задачу. Страшно."
              difficulty="basic"
              status="locked"
            />
          </div>
        </section>

        {/* Секция: Карточки стилей лидерства */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
            5. Карточки стилей лидерства (BuildCard)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BuildCard
              buildId="1"
              name="Архитектор систем"
              fantasy="Видит связи там, где другие видят хаос"
              icon="🏛️"
              status="active"
              activationProgress={100}
              requirements={[
                { nodeId: '1', nodeName: 'Системное видение', requiredLevel: 3, currentLevel: 3, isCompleted: true },
                { nodeId: '2', nodeName: 'Анализ трейдоффов', requiredLevel: 2, currentLevel: 2, isCompleted: true },
              ]}
              onClick={() => setSelectedBuild('1')}
            />
            <BuildCard
              buildId="2"
              name="Стратег"
              fantasy="Планирует на три хода вперёд"
              icon="♟️"
              status="available"
              activationProgress={60}
              requirements={[
                { nodeId: '3', nodeName: 'Стратегическое планирование', requiredLevel: 2, currentLevel: 1, isCompleted: false },
                { nodeId: '4', nodeName: 'Принятие решений', requiredLevel: 2, currentLevel: 2, isCompleted: true },
              ]}
              onClick={() => setSelectedBuild('2')}
            />
          </div>
        </section>

        {/* Секция: Детальная карточка стиля */}
        {selectedBuild && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
              5.1 Детальная карточка стиля (BuildCard variant=&quot;detailed&quot;)
            </h2>
            <BuildCard
              buildId={selectedBuild}
              name={selectedBuild === '1' ? 'Архитектор систем' : 'Стратег'}
              fantasy={selectedBuild === '1' ? 'Видит связи там, где другие видят хаос' : 'Планирует на три хода вперёд'}
              description={
                selectedBuild === '1'
                  ? 'Архитектор систем — это лидер, который видит организацию как живую систему взаимосвязей. Он понимает, как изменение в одной части влияет на другие, и принимает решения с учётом этих связей.'
                  : 'Стратег — это лидер, который мыслит наперёд. Он видит не только текущую ситуацию, но и её развитие, и готовит команду к будущим вызовам.'
              }
              icon={selectedBuild === '1' ? '🏛️' : '♟️'}
              status={selectedBuild === '1' ? 'active' : 'available'}
              activationProgress={selectedBuild === '1' ? 100 : 60}
              requirements={
                selectedBuild === '1'
                  ? [
                      { nodeId: '1', nodeName: 'Системное видение', requiredLevel: 3, currentLevel: 3, isCompleted: true },
                      { nodeId: '2', nodeName: 'Анализ трейдоффов', requiredLevel: 2, currentLevel: 2, isCompleted: true },
                    ]
                  : [
                      { nodeId: '3', nodeName: 'Стратегическое планирование', requiredLevel: 2, currentLevel: 1, isCompleted: false },
                      { nodeId: '4', nodeName: 'Принятие решений', requiredLevel: 2, currentLevel: 2, isCompleted: true },
                    ]
              }
              relatedNodes={[
                { id: '1', name: 'Системное видение' },
                { id: '2', name: 'Анализ трейдоффов' },
              ]}
              variant="detailed"
              onActivate={selectedBuild !== '1' ? () => alert('Активировать стиль') : undefined}
              onClose={() => setSelectedBuild(null)}
            />
          </section>
        )}

        {/* Секция: Модальные окна */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-ash-light mb-4 border-b border-ui-border-soft pb-2">
            6. Модальные окна
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowSituationModal(true)}
              className="px-4 py-2 bg-strategic-blue text-white rounded-lg hover:bg-strategic-blue/90"
            >
              ➕ Добавить ситуацию
            </button>
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="px-4 py-2 bg-strategic-blue text-white rounded-lg hover:bg-strategic-blue/90"
            >
              📎 Добавить доказательство
            </button>
            <button
              onClick={() => setShowReflectionModal(true)}
              className="px-4 py-2 bg-strategic-blue text-white rounded-lg hover:bg-strategic-blue/90"
            >
              🔍 Рефлексия
            </button>
          </div>
        </section>

        {/* Модальные окна */}
        <AddSituationModal
          isOpen={showSituationModal}
          nodeName="Удержание напряжения"
          nodeId="1"
          onClose={() => setShowSituationModal(false)}
          onSave={(data) => {
            console.log('Ситуация сохранена:', data);
            setShowSituationModal(false);
            alert('Ситуация сохранена!');
          }}
        />

        <AddEvidenceModal
          isOpen={showEvidenceModal}
          questId="1"
          questTitle="Практика делегирования"
          successCriteria={[
            { id: 'c1', text: 'Передал задачу с объяснением контекста', isCompleted: true },
            { id: 'c2', text: 'Не вмешивался в процесс выполнения', isCompleted: false },
            { id: 'c3', text: 'Записал результаты и инсайты', isCompleted: false },
          ]}
          onClose={() => setShowEvidenceModal(false)}
          onSave={(data) => {
            console.log('Доказательство сохранено:', data);
            setShowEvidenceModal(false);
            alert('Доказательство добавлено!');
          }}
        />

        <ReflectionModal
          isOpen={showReflectionModal}
          context={{ 
            type: 'case', 
            id: '1', 
            title: 'Делегирование с риском',
            selectedOption: 'B',
            selectedOptionTitle: 'Передать контекст'
          }}
          reflectionQuestion="Как часто ты передаёшь задачи без объяснения, почему это важно?"
          onClose={() => setShowReflectionModal(false)}
          onSave={(data) => {
            console.log('Рефлексия сохранена:', data);
            setShowReflectionModal(false);
            alert('Рефлексия сохранена!');
          }}
          onSkip={() => {
            setShowReflectionModal(false);
            alert('Рефлексия пропущена');
          }}
        />
      </div>
    </div>
  );
}
