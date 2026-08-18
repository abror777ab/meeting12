'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useMeeting } from '../../context/MeetingContext';

export function ReactionOverlay() {
  const { reactions } = useMeeting();

  // Agar '🎉' yoki '🚀' bo'lsa confetti otiladi
  useEffect(() => {
    const lastReaction = reactions[reactions.length - 1];
    if (lastReaction && (lastReaction.emoji === '🎉' || lastReaction.emoji === '🚀')) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch {
        // canvas-confetti browser fallback
      }
    }
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-20 flex flex-col items-center animate-reaction"
          style={{
            left: `${reaction.xPosition}%`,
          }}
        >
          <span className="text-4xl filter drop-shadow-lg select-none">
            {reaction.emoji}
          </span>
          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-white/90 font-semibold mt-1 border border-white/10 whitespace-nowrap shadow-md">
            {reaction.senderName}
          </span>
        </div>
      ))}
    </div>
  );
}
