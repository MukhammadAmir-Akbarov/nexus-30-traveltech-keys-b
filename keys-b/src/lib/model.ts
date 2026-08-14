// Модель берётся через Vercel AI Gateway строкой "provider/model" —
// SDK-пакет конкретного провайдера не нужен.
export const MODEL = process.env.AI_MODEL ?? 'anthropic/claude-sonnet-5';

/** Нет ключа -> весь продукт работает в offline-режиме (правила + предзаписанные ответы). */
export function hasAI(): boolean {
  if (process.env.DEMO_OFFLINE === '1') return false;
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}
