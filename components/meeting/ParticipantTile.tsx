'use client';

import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Pin,
  PinOff,
  Hand,
  Maximize,
  Tv,
} from 'lucide-react';
import { Participant } from '@/types/meeting';

interface ParticipantTileProps {
  participant: Participant;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
  className?: string;
}

export function ParticipantTile({
  participant,
  isPinned = false,
  onTogglePin,
  className = '',
}: ParticipantTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Attach camera stream
  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
      videoRef.current.play().catch(() => {});
    }
  }, [participant.stream, participant.isVideoEnabled]);

  // Attach dedicated audio stream for remote participants to guarantee microphone playback
  useEffect(() => {
    if (audioRef.current && participant.stream && !participant.isLocal) {
      audioRef.current.srcObject = participant.stream;
      audioRef.current.play().catch(() => {});
    }
  }, [participant.stream, participant.isLocal]);

  // Unblock browser audio autoplay policy on any user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Attach screen stream
  useEffect(() => {
    if (screenVideoRef.current && participant.screenStream) {
      screenVideoRef.current.srcObject = participant.screenStream;
      screenVideoRef.current.play().catch(() => {});
    }
  }, [participant.screenStream, participant.isScreenSharing]);

  const initials = participant.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isSpeaking = (participant.audioLevel && participant.audioLevel > 18) || participant.isSpeaking;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-300 group flex items-center justify-center ${
        isSpeaking
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/20'
          : 'border-slate-800 hover:border-slate-700'
      } ${className}`}
    >
      {/* Hidden audio element to guarantee remote participant microphone audio is played even when camera is off */}
      {!participant.isLocal && participant.stream && (
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      )}

      {/* Video Stream or Screen Stream */}
      {participant.isScreenSharing && participant.screenStream ? (
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain bg-black"
        />
      ) : participant.isVideoEnabled && participant.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal} // Mute local stream to prevent echo
          className={`w-full h-full object-cover ${participant.isLocal ? 'mirror-video' : ''}`}
        />
      ) : (
        /* Fallback Avatar */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4">
          <div
            className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr ${
              participant.avatarColor || 'from-blue-600 to-indigo-600'
            } flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-2xl transition-transform duration-300 ${
              isSpeaking ? 'scale-110 ring-4 ring-emerald-400/80 ring-offset-4 ring-offset-slate-900' : ''
            }`}
          >
            {initials || 'U'}

            {/* Speaking wave effect */}
            {isSpeaking && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-ping pointer-events-none" />
            )}
          </div>
          <span className="mt-3 text-xs sm:text-sm font-medium text-slate-300">
            {participant.name} {participant.isLocal && '(Siz)'}
          </span>
        </div>
      )}

      {/* Top Left: Hand Raised Badge */}
      {participant.isHandRaised && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-lg animate-bounce">
          <Hand className="w-3.5 h-3.5 fill-current" />
          <span>Qo&apos;l ko&apos;tardi</span>
        </div>
      )}

      {/* Top Right: Screen Sharing Badge / Pin Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {participant.isScreenSharing && (
          <div className="px-2 py-1 rounded-lg bg-blue-600/80 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1">
            <Tv className="w-3 h-3" />
            <span>Ekran ulashmoqda</span>
          </div>
        )}

        {onTogglePin && (
          <button
            type="button"
            onClick={() => onTogglePin(participant.id)}
            className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-200 backdrop-blur-md border border-slate-700 transition-all"
            title={isPinned ? "Ekranga qadashni bekor qilish" : "Ekranga qadash (Spotlight)"}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5 text-blue-400" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Bottom Floating Pill: Name, Speaking waveform, Mic status */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-slate-200 text-xs font-medium max-w-[85%] truncate shadow-md">
          {/* Speaking Waveform */}
          {participant.isAudioEnabled && isSpeaking && (
            <div className="flex items-end gap-0.5 h-3 shrink-0">
              <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
            </div>
          )}

          <span className="truncate">
            {participant.name} {participant.isLocal && '(Siz)'}
          </span>

          {participant.isHost && (
            <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Host
            </span>
          )}
        </div>

        {/* Audio Muted / Unmuted Indicator */}
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-md backdrop-blur-md ${
            participant.isAudioEnabled
              ? 'bg-slate-950/85 text-slate-300 border border-slate-800'
              : 'bg-red-500/90 text-white border border-red-500/50'
          }`}
        >
          {participant.isAudioEnabled ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-white" />
          )}
        </div>
      </div>
    </div>
  );
}
