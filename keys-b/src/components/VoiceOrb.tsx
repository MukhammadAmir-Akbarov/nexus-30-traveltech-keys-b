'use client';

import { motion } from 'framer-motion';

export function VoiceOrb({ isListening }: { isListening: boolean }) {
  if (!isListening) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5],
          boxShadow: [
            "0 0 40px 10px rgba(14, 151, 157, 0.3)",
            "0 0 100px 30px rgba(14, 151, 157, 0.6)",
            "0 0 40px 10px rgba(14, 151, 157, 0.3)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#0E979D] to-indigo-500 flex items-center justify-center"
      >
        <span className="text-4xl">🎙️</span>
      </motion.div>
      <div className="absolute bottom-32 text-white text-xl font-medium tracking-wide animate-pulse">
        Listening...
      </div>
    </div>
  );
}
