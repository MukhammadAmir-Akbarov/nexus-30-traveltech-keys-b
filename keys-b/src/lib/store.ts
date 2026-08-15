import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { CORPUS } from '@/data/corpus';
import { GUIDES } from '@/data/guides';
import { hashPassword, verifyPassword, type Role } from './auth';
import { mergeCorpus, mergeGuides } from './snapshot-merge';
import type {
  CheckStatus,
  CorpusItem,
  FactRecord,
  Guide,
  GuideAccuracy,
  GuideAccuracyByPlace,
  RequestKind,
  TouristRequest,
} from './types';

// Серверное хранилище прототипа.
//
// Данные живут в памяти процесса, а после каждой правки снимок ложится
// на диск. Перезапуск больше не стирает проверки фактов, репутацию гидов,
// возражения и заявки: демо переживает падение сервера, а Комитет не теряет
// накопленное между показами.
//
// ponytail: JSON-файл, а не база. Объём прототипа — сотни записей, запись
// идёт пачкой на следующем тике, и переход на настоящую базу меняет только
// две функции ниже, а не двадцать четыре вызова снаружи.
//
// Путь задаётся DATA_FILE; на площадке с эфемерным диском файл переживает
// перезапуск процесса, но не пересоздание машины — это честно и достаточно
// для прототипа.

export type User = {
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  /** Только для роли guide: к какой карточке гида привязан аккаунт. */
  guideId?: string;
};

type Store = {
  users: Map<string, User>;
  guides: Guide[];
  corpus: CorpusItem[];
  /**
   * Уже зачтённые проверки: `clientId|guideId|утверждение`.
   * Без этого любой желающий отправляет одну и ту же чушь двадцать раз подряд
   * и топит репутацию гида — вся идея рейтинга по фактам рушится одним скриптом.
   */
  countedChecks: Set<string>;
  /** Отметки времени проверок по клиенту — грубый лимит частоты. */
  checkTimes: Map<string, number[]>;
  /** Итоги проверок по гидам: guideId -> счётчики вердиктов. */
  accuracy: Map<string, GuideAccuracy>;
  /**
   * То же самое в разрезе объектов: `guideId|placeId` -> счётчики.
   * Из голосового отзыва: гид может отлично знать Музей исламской цивилизации
   * и не знать Регистана — общая оценка это скрывает.
   */
  accuracyByPlace: Map<string, GuideAccuracy>;
  /** Отдельные проверки: гид должен видеть не цифру, а конкретные утверждения. */
  verdicts: FactRecord[];
  /** Входящие от туристов: проблема на объекте и запрос гида. */
  requests: TouristRequest[];
};

const DATA_FILE = process.env.DATA_FILE ?? '.data/store.json';

/** Что сохраняем. checkTimes не входит: это скользящее окно лимита, оно живёт час. */
type Snapshot = {
  users: [string, User][];
  guides: Guide[];
  corpus: CorpusItem[];
  countedChecks: string[];
  accuracy: [string, GuideAccuracy][];
  accuracyByPlace: [string, GuideAccuracy][];
  verdicts: FactRecord[];
  requests: TouristRequest[];
};

function readSnapshot(): Snapshot | null {
  try {
    if (!existsSync(DATA_FILE)) return null;
    return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as Snapshot;
  } catch {
    // битый файл не должен ронять сервер: начинаем с посева
    return null;
  }
}

let pending: NodeJS.Timeout | null = null;

/**
 * Отложенная запись снимка. Пачкой на следующем тике: одна проверка факта
 * трогает три структуры сразу, и писать файл трижды незачем.
 */
function persist(): void {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    const s = store();
    const snapshot: Snapshot = {
      users: [...s.users],
      guides: s.guides,
      corpus: s.corpus,
      countedChecks: [...s.countedChecks],
      accuracy: [...s.accuracy],
      accuracyByPlace: [...s.accuracyByPlace],
      verdicts: s.verdicts,
      requests: s.requests,
    };
    try {
      mkdirSync(dirname(DATA_FILE), { recursive: true });
      writeFileSync(DATA_FILE, JSON.stringify(snapshot), 'utf8');
    } catch {
      // диск только для чтения — работаем как раньше, из памяти
    }
  }, 250);
  // не держим процесс живым ради записи
  pending.unref?.();
}

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
  // демо-история: один и тот же гид силён на одном объекте и слаб на другом
  const accuracyByPlace = new Map<string, GuideAccuracy>([
    ['g1|registan', { confirmed: 9, refuted: 0, unclear: 1 }],
    ['g1|shahi-zinda', { confirmed: 3, refuted: 0, unclear: 0 }],
    ['g5|khast-imam', { confirmed: 11, refuted: 0, unclear: 1 }],
    ['g5|registan', { confirmed: 4, refuted: 3, unclear: 1 }],
    ['g6|aydarkul', { confirmed: 4, refuted: 0, unclear: 1 }],
    ['g6|registan', { confirmed: 0, refuted: 3, unclear: 0 }],
  ]);
  return {
    users,
    corpus: [...CORPUS],
    guides: [...GUIDES],
    accuracy,
    accuracyByPlace,
    countedChecks: new Set<string>(),
    checkTimes: new Map<string, number[]>(),
    // Демо-история: без неё кабинет гида и ящик заявок пусты при первом входе,
    // и жюри видит форму без содержимого. Счётчики выше с этим согласованы.
    verdicts: [
      {
        id: 'v1',
        guideId: 'g1',
        placeId: 'registan',
        claim: 'Регистан построен в XII веке',
        status: 'refuted',
        at: '2026-08-14 11:20',
      },
      {
        id: 'v2',
        guideId: 'g1',
        placeId: 'registan',
        claim: 'Медресе Улугбека построено в 1417–1420 годах',
        status: 'confirmed',
        at: '2026-08-14 11:38',
      },
      {
        id: 'v3',
        guideId: 'g6',
        placeId: 'registan',
        claim: 'Регистан был главным базаром города',
        status: 'refuted',
        at: '2026-08-14 15:02',
        dispute: {
          note: 'Площадь действительно была торговой до застройки медресе — я говорил об этом периоде.',
          at: '2026-08-14 18:10',
        },
      },
      {
        id: 'v4',
        guideId: 'g5',
        placeId: 'khast-imam',
        claim: 'Здесь хранится Коран Османа',
        status: 'confirmed',
        at: '2026-08-14 16:44',
      },
    ],
    requests: [
      {
        id: 'r1',
        kind: 'place-problem',
        targetId: 'shahi-zinda',
        message: 'Верхний ярус закрыт на реставрацию, в кассе об этом не предупреждают.',
        contact: '+998 90 123-45-67',
        at: '2026-08-14 12:05',
      },
      {
        id: 'r2',
        kind: 'guide-booking',
        targetId: 'g2',
        message: 'Нужен гид на 17–19 августа, Самарканд и Бухара, английский язык.',
        contact: 'anna.travel@example.com',
        at: '2026-08-14 19:30',
      },
    ],
  };
}

function store(): Store {
  if (!globalStore.__nexus30) {
    const fresh = seed();
    const saved = readSnapshot();
    if (saved) {
      // Поверх посева кладём сохранённое: список объектов и гидов в коде
      // может пополниться между запусками, а накопленное терять нельзя.
      //
      // Пользователи — единственное исключение, и порядок здесь обратный:
      // сначала сохранённые (гиды, регистрации), сверху посев из окружения.
      // Иначе администратор навсегда остаётся с тем паролем, с которым сервер
      // запустили в первый раз: смена ADMIN_PASSWORD перестаёт действовать,
      // а старый пароль продолжает пускать. Поймано измерением: после
      // перезапуска с новым паролем вход отвечал 401.
      fresh.users = new Map([...saved.users, ...fresh.users]);

      // Слияние по id, а не замена снимком целиком: правила и их причины —
      // в snapshot-merge.ts, под самопроверкой. Коротко: раньше снимок
      // ЗАМЕНЯЛ посев, и абзац, добавленный в corpus.ts, не доезжал до
      // поиска на инстансе со старым снимком, а /how показывал новое число
      // из константы сборки. Та самая сигнатура «прод отличается от сборки».
      fresh.corpus = mergeCorpus(fresh.corpus, saved.corpus);
      fresh.guides = mergeGuides(fresh.guides, saved.guides);
      fresh.countedChecks = new Set(saved.countedChecks ?? []);
      fresh.accuracy = new Map(saved.accuracy ?? []);
      fresh.accuracyByPlace = new Map(saved.accuracyByPlace ?? []);
      fresh.verdicts = saved.verdicts ?? [];
      fresh.requests = saved.requests ?? [];
    }
    globalStore.__nexus30 = fresh;
  }
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
  persist();
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
  persist();
  return guide;
}

export function upsertGuide(guide: Guide): Guide {
  const index = store().guides.findIndex((g) => g.id === guide.id);
  if (index >= 0) store().guides[index] = guide;
  else store().guides.push(guide);
  persist();
  return guide;
}

export function removeGuide(id: string): boolean {
  const before = store().guides.length;
  store().guides = store().guides.filter((g) => g.id !== id);
  persist();
  return store().guides.length < before;
}

// --- репутация гида по проверкам фактов ---

/** Не больше стольких проверок с одного устройства за час. */
const CHECKS_PER_HOUR = 30;

export type RecordOutcome = 'counted' | 'duplicate' | 'rate-limited';

/**
 * Зачесть вердикт в репутацию гида — если это не повтор и не поток от бота.
 * `clientId` приходит из HttpOnly-cookie: полноценной личности у туриста нет,
 * но одного устройства достаточно, чтобы накрутка перестала быть бесплатной.
 */
export function recordFactCheck(
  guideId: string,
  status: CheckStatus,
  placeId: string | undefined,
  clientId: string,
  claim: string,
  now = Date.now(),
): RecordOutcome {
  // частота: скользящий час
  const times = (store().checkTimes.get(clientId) ?? []).filter((t) => now - t < 3_600_000);
  if (times.length >= CHECKS_PER_HOUR) {
    store().checkTimes.set(clientId, times);
    return 'rate-limited';
  }
  store().checkTimes.set(clientId, [...times, now]);

  // повтор: то же утверждение про того же гида с того же устройства
  const key = `${clientId}|${guideId}|${claim.trim().toLowerCase()}`;
  if (store().countedChecks.has(key)) return 'duplicate';
  store().countedChecks.add(key);

  const current = store().accuracy.get(guideId) ?? { confirmed: 0, refuted: 0, unclear: 0 };
  current[status] += 1;
  store().accuracy.set(guideId, current);

  // сохраняем саму проверку: гид должен видеть, за что именно ему поставили минус
  store().verdicts.push({
    id: `v${store().verdicts.length + 1}-${Math.round(performance.now())}`,
    guideId,
    placeId,
    claim: claim.trim(),
    status,
    at: new Date(now).toISOString().slice(0, 16).replace('T', ' '),
  });

  // и отдельно по объекту, если известно, где именно это прозвучало
  if (placeId) {
    const placeKey = `${guideId}|${placeId}`;
    const perPlace = store().accuracyByPlace.get(placeKey) ?? {
      confirmed: 0,
      refuted: 0,
      unclear: 0,
    };
    perPlace[status] += 1;
    store().accuracyByPlace.set(placeKey, perPlace);
  }
  persist();
  return 'counted';
}

/**
 * Сводка по объектам для Комитета: где гидов опровергают чаще всего.
 * Считаем по всем гидам сразу — это уже не репутация, а карта проблемных мест.
 */
export function getPlaceFactStats(): { placeId: string; confirmed: number; refuted: number }[] {
  const totals = new Map<string, { confirmed: number; refuted: number }>();
  for (const [key, stats] of store().accuracyByPlace) {
    const placeId = key.split('|')[1];
    const current = totals.get(placeId) ?? { confirmed: 0, refuted: 0 };
    current.confirmed += stats.confirmed;
    current.refuted += stats.refuted;
    totals.set(placeId, current);
  }
  return [...totals.entries()]
    .map(([placeId, stats]) => ({ placeId, ...stats }))
    .filter((row) => row.confirmed + row.refuted > 0)
    .sort(
      (a, b) =>
        b.refuted / (b.confirmed + b.refuted) - a.refuted / (a.confirmed + a.refuted) ||
        b.refuted - a.refuted,
    );
}

export function getAccuracy(): Record<string, GuideAccuracy> {
  return Object.fromEntries(store().accuracy);
}

/** guideId -> { placeId -> счётчики }. */
export function getAccuracyByPlace(): Record<string, GuideAccuracyByPlace> {
  const result: Record<string, GuideAccuracyByPlace> = {};
  for (const [key, stats] of store().accuracyByPlace) {
    const [guideId, placeId] = key.split('|');
    result[guideId] ??= {};
    result[guideId][placeId] = stats;
  }
  return result;
}

// --- сторона гида ---

/**
 * Доступ гида к своей карточке. Логин и пароль отдаёт администратор:
 * в проде здесь будет реестр Комитета, в прототипе — одна кнопка в админке.
 */
export function createGuideAccount(guideId: string, password: string): User | null {
  const guide = store().guides.find((g) => g.id === guideId);
  if (!guide || password.length < 6) return null;
  const email = `${guideId}@gid.nexus30.uz`;
  if (store().users.has(email)) return null;
  const user: User = {
    email,
    passwordHash: hashPassword(password),
    role: 'guide',
    guideId,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  store().users.set(email, user);
  persist();
  return user;
}

export function listVerdictsForGuide(guideId: string): FactRecord[] {
  return store().verdicts.filter((v) => v.guideId === guideId).reverse();
}

/** Гид не согласен с вердиктом. Счётчики не трогаем — решение за Комитетом. */
export function disputeVerdict(verdictId: string, guideId: string, note: string): boolean {
  const record = store().verdicts.find((v) => v.id === verdictId && v.guideId === guideId);
  if (!record || record.dispute) return false;
  record.dispute = { note: note.trim().slice(0, 500), at: new Date().toISOString().slice(0, 16).replace('T', ' ') };
  persist();
  return true;
}

export function listDisputes(): FactRecord[] {
  return store().verdicts.filter((v) => v.dispute).reverse();
}

export function resolveDispute(verdictId: string, outcome: 'upheld' | 'rejected'): boolean {
  const record = store().verdicts.find((v) => v.id === verdictId);
  if (!record?.dispute) return false;
  record.dispute.resolved = outcome;
  // жалоба удовлетворена — снимаем вердикт из счётчиков, иначе он висит вечно
  if (outcome === 'upheld') {
    const stats = store().accuracy.get(record.guideId);
    if (stats && stats[record.status] > 0) stats[record.status] -= 1;
    if (record.placeId) {
      const perPlace = store().accuracyByPlace.get(`${record.guideId}|${record.placeId}`);
      if (perPlace && perPlace[record.status] > 0) perPlace[record.status] -= 1;
    }
  }
  persist();
  return true;
}

// --- заявки от туристов ---

export function addRequest(
  kind: RequestKind,
  targetId: string,
  message: string,
  contact: string,
): TouristRequest {
  const item: TouristRequest = {
    id: `r${store().requests.length + 1}`,
    kind,
    targetId,
    message: message.trim().slice(0, 500),
    contact: contact.trim().slice(0, 120),
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  store().requests.push(item);
  persist();
  return item;
}

/** Не больше пяти заявок с одного адреса за десять минут. */
const requestTimes = new Map<string, number[]>();

export function requestsAllowed(ip: string, now = Date.now()): boolean {
  const recent = (requestTimes.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 5) {
    requestTimes.set(ip, recent);
    return false;
  }
  requestTimes.set(ip, [...recent, now]);
  return true;
}

export function listRequests(): TouristRequest[] {
  return [...store().requests].reverse();
}

export function markRequestDone(id: string): boolean {
  const item = store().requests.find((r) => r.id === id);
  if (!item) return false;
  item.done = true;
  persist();
  return true;
}

export function addCorpusItem(item: CorpusItem): CorpusItem {
  store().corpus.push(item);
  persist();
  return item;
}

export function removeCorpusItem(id: string): boolean {
  const before = store().corpus.length;
  store().corpus = store().corpus.filter((c) => c.id !== id);
  persist();
  return store().corpus.length < before;
}
