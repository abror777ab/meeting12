'use client';

import React from 'react';
import { MeetingReaction } from '@/types/meeting';

interface ReactionsOverlayProps {
  reactions: MeetingReaction[];
}

export function ReactionsOverlay({ reactions }: ReactionsOverlayProps) {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((react) => (
        <div
          key={react.id}
          className="absolute animate-reaction flex flex-col items-center"
          style={{
            left: `${react.x}%`,
            bottom: `${react.y}px`,
          }}
        >
          <span className="text-4xl sm:text-5xl filter drop-shadow-lg select-none">
            {react.emoji}
          </span>
          <span className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 shadow-md mt-1">
            {react.senderName}
          </span>
        </div>
      ))}
    </div>
  );
}
