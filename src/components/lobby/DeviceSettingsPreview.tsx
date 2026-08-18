'use client';

import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings2,
  FlipHorizontal,
  Sparkles,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { AudioVisualizer } from '../common/AudioVisualizer';
import { Button } from '../common/Button';

interface DeviceSettingsPreviewProps {
  stream: MediaStream | null;
  name: string;
  avatarColor: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isMirrored?: boolean;
  isBlurred?: boolean;
  audioLevel: number;
  isLoading: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleMirror?: () => void;
  onToggleBlur?: () => void;
  onOpenSettings?: () => void;
}

export function DeviceSettingsPreview({
  stream,
  name,
  avatarColor,
  isAudioMuted,
  isVideoMuted,
  isMirrored = true,
  isBlurred = false,
  audioLevel,
  isLoading,
  onToggleAudio,
  onToggleVideo,
  onToggleMirror,
  onToggleBlur,
  onOpenSettings,
}: DeviceSettingsPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream && !isVideoMuted) {
        video.srcObject = stream;
        video.play().catch(() => {});
      } else {
        video.srcObject = null;
      }
    }
  }, [stream, isVideoMuted]);

  return (
    <div className="relative w-full aspect-video sm:aspect-[16/10] max-h-[320px] sm:max-h-[380px] bg-[#070a10] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center">
      {/* Video Element with Mirror & Virtual Blur Filter */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-all duration-300 ${
          isMirrored ? 'transform -scale-x-100' : ''
        } ${isBlurred ? 'filter blur-[4px]' : ''} ${
          isVideoMuted || !stream ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      />

      {/* Fallback Avatar when camera is off */}
      {(isVideoMuted || !stream) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-[#0a0d14] to-black p-6">
          <Avatar
            name={name || 'Siz'}
            colorClass={avatarColor}
            size="xl"
            isSpeaking={!isAudioMuted && audioLevel > 20}
          />
          <p className="mt-4 text-xs sm:text-sm font-medium text-gray-400">
            {isLoading ? 'Qurilmalar yuklanmoqda...' : 'Kamera o‘chirilgan'}
          </p>
        </div>
      )}

      {/* Top Badges (Live Name & Audio Status) */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 max-w-[60%]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-white truncate">
            {name.trim() ? name : 'Ismingiz'}
          </span>
        </div>

        <AudioVisualizer level={audioLevel} isMuted={isAudioMuted} barCount={4} />
      </div>

      {/* Camera Video Effects Quick Controls (Top Right) */}
      {!isVideoMuted && stream && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 z-10">
          {onToggleMirror && (
            <button
              type="button"
              onClick={onToggleMirror}
              title={isMirrored ? 'Oyna rejimini o‘chirish' : 'Oyna rejimini yoqish'}
              className={`p-1.5 sm:p-2 rounded-xl backdrop-blur-md border text-xs transition-all ${
                isMirrored
                  ? 'bg-blue-600/80 border-blue-400 text-white'
                  : 'bg-black/50 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {onToggleBlur && (
            <button
              type="button"
              onClick={onToggleBlur}
              title="Fonni xiralashtirish (Virtual Blur)"
              className={`p-1.5 sm:p-2 rounded-xl backdrop-blur-md border text-xs transition-all ${
                isBlurred
                  ? 'bg-indigo-600/80 border-indigo-400 text-white shadow-lg'
                  : 'bg-black/50 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-gray-900/85 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-xl z-10">
        <Button
          type="button"
          size="icon"
          variant={isAudioMuted ? 'controlDanger' : 'control'}
          onClick={onToggleAudio}
          className="w-10 h-10 sm:w-11 sm:h-11"
          title={isAudioMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o‘chirish'}
        >
          {isAudioMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>

        <Button
          type="button"
          size="icon"
          variant={isVideoMuted ? 'controlDanger' : 'control'}
          onClick={onToggleVideo}
          className="w-10 h-10 sm:w-11 sm:h-11"
          title={isVideoMuted ? 'Kamerani yoqish' : 'Kamerani o‘chirish'}
        >
          {isVideoMuted ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>

        {onOpenSettings && (
          <Button
            type="button"
            size="icon"
            variant="control"
            onClick={onOpenSettings}
            className="w-10 h-10 sm:w-11 sm:h-11"
            title="Qurilma sozlamalari"
          >
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
