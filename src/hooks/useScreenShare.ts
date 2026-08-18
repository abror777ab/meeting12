'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MediaStreamService } from '../services/media-stream.service';

export function useScreenShare(onEnded?: () => void) {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      MediaStreamService.stopMediaStream(screenStreamRef.current);
      setScreenStream(null);
    }
    setIsSharing(false);
    onEnded?.();
  }, [onEnded]);

  const startScreenShare = useCallback(async () => {
    setError(null);
    try {
      const stream = await MediaStreamService.getDisplayMedia();

      // Foydalanuvchi brauzer panelidan "Stop sharing" bosganda:
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setScreenStream(stream);
      setIsSharing(true);
      return stream;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Ekranni ulashish bekor qilindi';
      setError(errorMsg);
      setIsSharing(false);
      return null;
    }
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (isSharing) {
      stopScreenShare();
      return null;
    } else {
      return await startScreenShare();
    }
  }, [isSharing, startScreenShare, stopScreenShare]);

  useEffect(() => {
    return () => {
      if (screenStreamRef.current) {
        MediaStreamService.stopMediaStream(screenStreamRef.current);
      }
    };
  }, []);

  return {
    screenStream,
    isSharing,
    error,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
  };
}
