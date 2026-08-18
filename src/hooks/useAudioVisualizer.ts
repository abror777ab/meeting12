'use client';

import { useState, useEffect, useRef } from 'react';
import { AudioAnalyzerService } from '../services/audio-analyzer.service';

export function useAudioVisualizer(stream: MediaStream | null | undefined, isMuted = false) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const analyzerRef = useRef<AudioAnalyzerService | null>(null);

  useEffect(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new AudioAnalyzerService();
    }

    const analyzer = analyzerRef.current;

    if (!stream || isMuted) {
      analyzer.stop();
      return;
    }

    analyzer.start(stream, (level) => {
      setAudioLevel(level);
    });

    return () => {
      analyzer.stop();
    };
  }, [stream, isMuted]);

  return isMuted || !stream ? 0 : audioLevel;
}
