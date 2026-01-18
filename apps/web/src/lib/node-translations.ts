/**
 * Получить человекочитаемое название узла способностей
 */
export function getNodeName(
  nodeId: string,
  nodeDescriptions: Record<string, { name?: string; title?: string }> = {}
): string {
  // Если есть описание в словаре — используем его
  const description = nodeDescriptions[nodeId];
  if (description) {
    return description.name || description.title || nodeId;
  }

  // Fallback: форматируем nodeId в читаемый вид
  // delegation_basics -> Delegation Basics
  return nodeId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
