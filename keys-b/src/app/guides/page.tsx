import { Icon } from '@/components/Icon';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import { matchGuides } from '@/lib/match';
import { db } from '@/lib/db'; // Wait, let's just use existing json for now if DB fails
import { TinderGuides } from '@/components/TinderGuides';

export const dynamic = 'force-dynamic';

export default async function GuidesPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string; dest?: string }>;
}) {
  const { context, dest } = await searchParams;
  let guides = await matchGuides(context ?? '', dest ?? '');

  // Sort guides by match score basically
  guides.sort((a, b) => {
    const scoreA = a.accuracy?.confirmed ? (a.accuracy.confirmed / (a.accuracy.confirmed + a.accuracy.refuted)) : 1;
    const scoreB = b.accuracy?.confirmed ? (b.accuracy.confirmed / (b.accuracy.confirmed + b.accuracy.refuted)) : 1;
    return scoreB - scoreA;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 w-full relative">
      <div className="px-6 pt-12 pb-6 bg-[#0E979D] text-white rounded-b-[40px] shadow-lg relative z-10">
        <h1 className="text-3xl font-extrabold mb-2">Find Your Guide</h1>
        <p className="text-teal-100 text-sm">Swipe right to match, left to pass. We've ordered them by compatibility score!</p>
        
        {context && (
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex gap-3">
            <span className="text-2xl mt-1">💡</span>
            <div>
              <div className="text-xs text-teal-200 font-bold uppercase tracking-wider mb-1">Your Request</div>
              <div className="text-sm italic text-white leading-relaxed">"{context}"</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 w-full px-4 -mt-4 relative z-20">
        <TinderGuides guides={guides} />
      </div>
    </div>
  );
}
