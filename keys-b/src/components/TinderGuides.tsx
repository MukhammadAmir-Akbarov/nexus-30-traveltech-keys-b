'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/Avatar';
import { REGION_LABEL, t, tr } from '@/lib/i18n';
import { useTrip } from '@/components/TripProvider';

export function TinderGuides({ guides }: { guides: any[] }) {
  const { lang } = useTrip();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (guides.length === 0) {
    return <div className="text-center p-8">No guides found.</div>;
  }

  if (currentIndex >= guides.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-xl mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">You've seen them all!</h2>
        <button onClick={() => setCurrentIndex(0)} className="bg-[#0E979D] text-white px-6 py-2 rounded-full mt-4">Start Over</button>
      </div>
    );
  }

  const currentItem = guides[currentIndex];
  const currentGuide = currentItem.guide || currentItem;
  
  const matchScore = currentItem.accuracy?.confirmed ? 
    Math.round((currentItem.accuracy.confirmed / (currentItem.accuracy.confirmed + currentItem.accuracy.refuted)) * 100) : 
    (currentGuide.rating ? Math.round(currentGuide.rating * 20) : 95);

  const handleSwipe = (direction: 'left' | 'right') => {
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-[550px] mt-8 flex justify-center">
      <AnimatePresence>
        <motion.div
          key={currentGuide.id}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-white rounded-[40px] shadow-[0_20px_50px_rgba(14,151,157,0.2)] border-2 border-teal-100 overflow-hidden flex flex-col"
        >
          {/* Match Score Glow */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0E979D]/30 to-transparent z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center pt-8 pb-4 px-6 flex-1">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                {currentGuide.photoUrl ? (
                  <img src={currentGuide.photoUrl} alt={currentGuide.name} className="w-full h-full object-cover" />
                ) : (
                  <Avatar name={currentGuide.name} size={128} />
                )}
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-[#0E979D] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 border-2 border-white whitespace-nowrap">
                ✨ {matchScore}% Match
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mt-6 text-center">{currentGuide.name}</h2>
            
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">★ {currentGuide.rating?.toFixed(1) || '5.0'}</span>
              <span className="bg-teal-50 text-teal-800 px-2 py-1 rounded text-xs font-semibold">
                ${currentGuide.hourlyRate || currentGuide.pricePerDay || 25}/hr
              </span>
              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold">
                {currentGuide.licenseNumber || currentGuide.verified ? 'Verified' : 'New'}
              </span>
            </div>

            <p className="text-slate-600 text-sm mt-4 text-center leading-relaxed line-clamp-3">
              {currentGuide.shortBio || (typeof currentGuide.bio === 'object' ? tr(currentGuide.bio, lang) : currentGuide.bio) || 'Expert local guide passionate about culture and history.'}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-1">
              {(currentGuide.languages || []).map((l: string) => (
                <span key={l} className="text-[10px] text-slate-400 uppercase font-bold tracking-wider px-2 border border-slate-200 rounded-full">{l}</span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 flex justify-center gap-6 bg-slate-50 border-t border-slate-100 mt-auto">
            <button 
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-white shadow-[0_5px_15px_rgba(0,0,0,0.1)] flex items-center justify-center text-3xl text-rose-500 hover:scale-110 hover:bg-rose-50 transition-all border border-slate-100"
            >
              ✕
            </button>
            <button 
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-400 to-[#0E979D] shadow-[0_8px_20px_rgba(14,151,157,0.4)] flex items-center justify-center text-3xl text-white hover:scale-110 transition-all"
            >
              ♥
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
