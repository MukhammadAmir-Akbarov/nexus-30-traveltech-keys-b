import { danglingRefs, tableSummary, type RuntimeRefs } from '@/lib/db';
import {
  getAccuracy,
  getAccuracyByPlace,
  getCorpus,
  getGuides,
  listRequests,
  listUsers,
  listDisputes,
} from '@/lib/store';
import { DataSchema } from './DataSchema';

// Схема данных глазами, а не в комментарии.
//
// «Одна база» — это не только один модуль в коде: человек должен видеть, из
// чего она состоит, сколько в ней строк и связна ли она прямо сейчас. Отсюда
// проверка целостности запускается на живых данных, включая накопленные:
// удалили гида — его вердикты и счётчики повиснут, и это станет видно здесь,
// а не всплывёт на показе.

export const dynamic = 'force-dynamic';

export default async function AdminDataPage() {
  const guides = getGuides();
  const users = listUsers();
  const requests = listRequests();
  // вердикты собираем через разбор жалоб: отдельного списка «все вердикты»
  // наружу нет, а для проверки целостности достаточно тех, что есть в store
  const verdicts = listDisputes();
  const accuracy = getAccuracy();
  const byPlace = getAccuracyByPlace();

  const accuracyKeys = [
    ...Object.keys(accuracy),
    ...Object.entries(byPlace).flatMap(([guideId, places]) =>
      Object.keys(places).map((placeId) => `${guideId}|${placeId}`),
    ),
  ];

  const runtime: RuntimeRefs = {
    guideIds: guides.map((g) => g.id),
    verdicts: verdicts.map((v) => ({ id: v.id, guideId: v.guideId, placeId: v.placeId })),
    requests: requests.map((r) => ({ id: r.id, kind: r.kind, targetId: r.targetId })),
    users: users.map((u) => ({ email: u.email, guideId: u.guideId })),
    accuracyKeys,
  };

  const runtimeTables = [
    { table: 'guides', rows: guides.length, source: 'накопленное' as const },
    { table: 'corpus (с правками)', rows: getCorpus().length, source: 'накопленное' as const },
    { table: 'users', rows: users.length, source: 'накопленное' as const },
    { table: 'requests', rows: requests.length, source: 'накопленное' as const },
    { table: 'accuracy', rows: accuracyKeys.length, source: 'накопленное' as const },
  ];

  return (
    <DataSchema
      tables={[...tableSummary(), ...runtimeTables]}
      problems={danglingRefs(runtime)}
    />
  );
}
