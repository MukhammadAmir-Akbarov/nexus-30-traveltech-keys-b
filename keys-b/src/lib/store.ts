import { CORPUS } from '@/data/corpus';
import { GUIDES } from '@/data/guides';
import { hashPassword, verifyPassword, type Role } from './auth';
import type { CheckStatus, CorpusItem, Guide, GuideAccuracy } from './types';

// Серверное хранилище прототипа.
// ponytail: всё в памяти процесса — правки админа живут до перезапуска,
// база данных здесь не нужна и на демо только мешает. Когда понадобится
// сохранность, меняется реализация этого файла, вызовы остаются теми же.
// Экспорт JSON на странице админки даёт перенести правки в data/*.

export type User = {
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

type Store = {
  users: Map<string, User>;
  guides: Guide[];
  corpus: CorpusItem[];
  /** Итоги проверок фактов по гидам: guideId -> счётчики вердиктов. */
  accuracy: Map<string, GuideAccuracy>;
};

const globalStore = globalThis as unknown as { __nexus30?: Store };

function seed(): Store {
  const users = new Map<string, User>();
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@nexus30.uz').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'nexus30';
  users.set(adminEmail, {
    email: adminEmail,
    passwordHash: hashPassword(adminPassword),
    role: 'admin',
    createdAt: '—',
  });
  // немного истории проверок, чтобы репутация была видна сразу на демо
  const accuracy = new Map<string, GuideAccuracy>([
    ['g1', { confirmed: 12, refuted: 0, unclear: 1 }],
    ['g5', { confirmed: 21, refuted: 1, unclear: 2 }],
    ['g6', { confirmed: 4, refuted: 3, unclear: 1 }],
  ]);
  return { users, corpus: [...CORPUS], guides: [...GUIDES], accuracy };
}

function store(): Store {
  globalStore.__nexus30 ??= seed();
  return globalStore.__nexus30;
}

// --- пользователи ---

export function findUser(email: string): User | undefined {
  return store().users.get(email.trim().toLowerCase());
}

export function listUsers(): User[] {
  return [...store().users.values()];
}

export function createUser(email: string, password: string, role: Role = 'user'): User | null {
  const key = email.trim().toLowerCase();
  if (!key.includes('@') || password.length < 6) return null;
  if (store().users.has(key)) return null;
  const user: User = {
    email: key,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  store().users.set(key, user);
  return user;
}

export function authenticate(email: string, password: string): User | null {
  const user = findUser(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

// --- контент ---

export function getGuides(): Guide[] {
  return store().guides;
}

export function getCorpus(): CorpusItem[] {
  return store().corpus;
}

export function toggleGuideVerified(id: string): Guide | null {
  const guide = store().guides.find((g) => g.id === id);
  if (!guide) return null;
  guide.verified = !guide.verified;
  return guide;
}

export function upsertGuide(guide: Guide): Guide {
  const index = store().guides.findIndex((g) => g.id === guide.id);
  if (index >= 0) store().guides[index] = guide;
  else store().guides.push(guide);
  return guide;
}

export function removeGuide(id: string): boolean {
  const before = store().guides.length;
  store().guides = store().guides.filter((g) => g.id !== id);
  return store().guides.length < before;
}

// --- репутация гида по проверкам фактов ---

export function recordFactCheck(guideId: string, status: CheckStatus): GuideAccuracy {
  const current = store().accuracy.get(guideId) ?? { confirmed: 0, refuted: 0, unclear: 0 };
  current[status] += 1;
  store().accuracy.set(guideId, current);
  return current;
}

export function getAccuracy(): Record<string, GuideAccuracy> {
  return Object.fromEntries(store().accuracy);
}

export function addCorpusItem(item: CorpusItem): CorpusItem {
  store().corpus.push(item);
  return item;
}

export function removeCorpusItem(id: string): boolean {
  const before = store().corpus.length;
  store().corpus = store().corpus.filter((c) => c.id !== id);
  return store().corpus.length < before;
}
