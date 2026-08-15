// Модель берётся через Vercel AI Gateway строкой "provider/model" —
// SDK-пакет конкретного провайдера не нужен.
export const MODEL = process.env.AI_MODEL ?? 'anthropic/claude-sonnet-5';

/** Нет ключа -> весь продукт работает в offline-режиме (правила + предзаписанные ответы). */
export function hasAI(): boolean {
  if (process.env.DEMO_OFFLINE === '1') return false;
  if (isMockAI()) return true;
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * Ветку модели надо уметь прогнать до того, как появится ключ, иначе она
 * впервые запустится за час до сдачи — и окажется, что она падает.
 * MOCK_AI=1 подменяет только вызов модели: маршрут по-прежнему проходит
 * санитайзинг id, вердикт — те же поля, интерфейс — ту же метку «ответ модели».
 */
export function isMockAI(): boolean {
  return process.env.MOCK_AI === '1';
}
