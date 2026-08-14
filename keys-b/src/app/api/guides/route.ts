import { GUIDES } from '@/data/guides';
import { matchGuides, type GuideQuery } from '@/lib/match';

// LLM здесь не нужен: подбор — это фильтр и сортировка.
export async function POST(req: Request) {
  const query = (await req.json()) as GuideQuery;
  return Response.json({ guides: matchGuides(GUIDES, query) });
}
