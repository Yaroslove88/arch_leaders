-- Проверка данных пользователя admin
SELECT 
  u.id, 
  u.username,
  q.id as quest_id,
  q.title as quest_title,
  q.status,
  q.reward_skill_xp,
  q.ability_node_id,
  q.linked_nodes,
  an.title as node_title
FROM "User" u
LEFT JOIN "Quest" q ON q.user_id = u.id
LEFT JOIN "AbilityNode" an ON an.id = q.ability_node_id
WHERE u.username = 'admin'
ORDER BY q.created_at DESC;
