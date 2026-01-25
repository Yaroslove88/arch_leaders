import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Прокси для админ-эндпоинтов NestJS API
 * Решает проблему авторизации между Payload CMS и NestJS API
 * 
 * Использование:
 * - Запросы к /api/admin-proxy/admin/v1/* проксируются на ${API_URL}/admin/v1/*
 * - Авторизация Payload проверяется и преобразуется в токен для NestJS API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'POST');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, 'DELETE');
}

async function handleProxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    // Проверяем авторизацию Payload
    const payload = await getPayload({ config });
    const user = await payload.auth({
      headers: request.headers,
    });

    if (!user || !user.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем роль пользователя
    const payloadUser = user.user as any;
    if (payloadUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Получаем путь из params
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];
    const apiPath = pathSegments.join('/');

    // Получаем токен для NestJS API
    // Если пользователь есть в admin_users - используем его токен
    // Иначе создаём токен на основе Payload пользователя
    const adminToken = await getAdminTokenForPayloadUser(payloadUser);

    // Формируем URL для проксирования
    const targetUrl = `${API_URL}/admin/v1/${apiPath}`;
    const url = new URL(targetUrl);
    
    // Копируем query параметры
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Подготавливаем тело запроса
    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }

    // Проксируем запрос к NestJS API
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        // Копируем важные заголовки
        ...(request.headers.get('accept') && { 'Accept': request.headers.get('accept')! }),
      },
      body,
    });

    // Получаем ответ
    const data = await response.text();
    let jsonData: any;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }

    // Возвращаем ответ с тем же статусом
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('[Admin Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Получить токен для NestJS API на основе Payload пользователя
 * 
 * Стратегия:
 * 1. Если пользователь есть в admin_users - используем его telegramUsername для логина
 * 2. Если пользователь из users с role='admin' - используем его telegramUsername
 * 3. Fallback: пробуем создать токен через login endpoint
 */
async function getAdminTokenForPayloadUser(payloadUser: any): Promise<string> {
  const telegramUsername = payloadUser.telegramUsername || payloadUser.email?.split('@')[0];
  
  if (!telegramUsername) {
    throw new Error('Cannot determine telegramUsername from Payload user');
  }

  // Пробуем получить токен через login endpoint
  // Используем пароль из env или fallback
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'admin-legacy';
  
  try {
    const loginResponse = await fetch(`${API_URL}/admin/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramUsername: telegramUsername.replace('@', ''),
        password,
      }),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      return loginData.access_token;
    }
    
    // Если логин не удался, пробуем с email
    if (payloadUser.email) {
      const emailLoginResponse = await fetch(`${API_URL}/admin/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payloadUser.email,
          password,
        }),
      });

      if (emailLoginResponse.ok) {
        const emailLoginData = await emailLoginResponse.json();
        return emailLoginData.access_token;
      }
    }
  } catch (error) {
    console.warn('[Admin Proxy] Failed to get token from NestJS API:', error);
  }

  // Если не удалось получить токен - выбрасываем ошибку
  throw new Error(`Failed to get admin token for Payload user ${telegramUsername}. Ensure user exists in admin_users table or users table with role='admin'.`);
}
