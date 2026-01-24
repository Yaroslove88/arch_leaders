import { PrismaService } from '../../prisma/prisma.service';

/**
 * Системные actors, которым разрешены операции без проверки роли
 */
export const SYSTEM_ACTORS = ['system', 'analyzer', 'admin', 'script', 'sync-base-quests'] as const;
export type SystemActor = typeof SYSTEM_ACTORS[number];

/**
 * Проверяет, является ли actor системным
 * @param actor - actor из request.body или x-actor header
 */
export function isSystemActor(actor: string | undefined | null): boolean {
  if (!actor) return false;
  return SYSTEM_ACTORS.includes(actor.toLowerCase() as SystemActor);
}

/**
 * Извлекает actor из request
 * @param request - HTTP request
 */
export function extractActor(request: any): string | undefined {
  return request?.body?.actor || request?.headers?.['x-actor'];
}

/**
 * Проверяет, является ли пользователь администратором
 * @param userId - ID пользователя из JWT (user.sub)
 * @param prisma - PrismaService для доступа к БД
 */
export async function isUserAdmin(
  userId: string | undefined | null,
  prisma: PrismaService,
): Promise<boolean> {
  if (!userId) return false;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Проверяет, имеет ли пользователь административный доступ
 * (либо через роль admin, либо через системный actor)
 * 
 * @param request - HTTP request
 * @param prisma - PrismaService
 * @returns { hasAccess: boolean, reason: string }
 */
export async function checkAdminAccess(
  request: any,
  prisma: PrismaService,
): Promise<{ hasAccess: boolean; reason: string }> {
  const actor = extractActor(request);
  const userId = request?.user?.sub;

  // Системные операции всегда разрешены
  if (isSystemActor(actor)) {
    return { hasAccess: true, reason: `system_actor:${actor}` };
  }

  // Проверяем роль пользователя
  if (await isUserAdmin(userId, prisma)) {
    return { hasAccess: true, reason: `admin_role:${userId}` };
  }

  return { hasAccess: false, reason: 'not_authorized' };
}
