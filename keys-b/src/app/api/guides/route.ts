import { getGuides } from '@/lib/store';
import { matchGuides, type GuideQuery } from '@/lib/match';

// LLM здесь не нужен: подбор — это фильтр и сортировка.
export async function POST(req: Request) {
  const query = (await req.json()) as GuideQuery;
  return Response.json({ guides: matchGuides(getGuides(), query) });
}
