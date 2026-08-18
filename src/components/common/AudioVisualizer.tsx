'use client';

import React from 'react';

interface AudioVisualizerProps {
  level: number; // 0 - 100
  isMuted?: boolean;
  barCount?: number;
}

export function AudioVisualizer({
  level,
  isMuted = false,
  barCount = 4,
}: AudioVisualizerProps) {
  if (isMuted) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 h-4 px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
      {Array.from({ length: barCount }).map((_, i) => {
        // dynamic height simulation based on real audio level
        const factor = (i + 1) / barCount;
        const waveOffset = Math.sin(i * 1.5) * 1.5;
        const barHeight = Math.max(3, Math.min(14, (level / 100) * 14 * factor + waveOffset));

        return (
          <div
            key={i}
            className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
            style={{
              height: level > 10 ? `${barHeight}px` : '3px',
              opacity: level > 10 ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
