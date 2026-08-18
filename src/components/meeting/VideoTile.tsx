'use client';

import React, { useRef, useEffect } from 'react';
import { MicOff, Pin, PinOff, Hand, MonitorUp } from 'lucide-react';
import { Participant } from '../../types/meeting';
import { Avatar } from '../common/Avatar';
import { AudioVisualizer } from '../common/AudioVisualizer';

interface VideoTileProps {
  participant: Participant;
  isPinned?: boolean;
  isSpotlight?: boolean;
  onTogglePin?: (id: string) => void;
}

export function VideoTile({
  participant,
  isPinned = false,
  isSpotlight = false,
  onTogglePin,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);

  const isSpeaking = !participant.isAudioMuted && participant.audioLevel > 20;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (participant.stream) {
      if (video.srcObject !== participant.stream) {
        video.srcObject = participant.stream;
      }
      video.play().catch(() => {
        // Autoplay policy fallback
      });
    } else {
      video.srcObject = null;
    }
  }, [participant.stream]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    if (participant.screenStream && participant.isScreenSharing) {
      if (screen.srcObject !== participant.screenStream) {
        screen.srcObject = participant.screenStream;
      }
      screen.play().catch(() => {});
    } else {
      screen.srcObject = null;
    }
  }, [participant.screenStream, participant.isScreenSharing]);

  return (
    <div
      className={`group relative w-full h-full min-h-[160px] sm:min-h-[200px] bg-[#07090f] rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center shadow-xl select-none ${
        isSpeaking
          ? 'border-emerald-500/80 shadow-emerald-500/10 ring-2 ring-emerald-500/30'
          : isPinned
          ? 'border-blue-500/80 shadow-blue-500/10 ring-2 ring-blue-500/30'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Screen Share Layer */}
      {participant.isScreenSharing && participant.screenStream ? (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          <video
            ref={screenRef}
            autoPlay
            playsInline
            muted={participant.isLocal}
            className="w-full h-full object-contain"
          />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600/80 backdrop-blur-md rounded-xl text-[11px] sm:text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg">
            <MonitorUp className="w-3.5 h-3.5 animate-pulse" />
            <span className="truncate max-w-[150px]">{participant.name} ulashmoqda</span>
          </div>
        </div>
      ) : (
        <>
          {/* WebRTC Video Stream with Mirror & Blur controls */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={participant.isLocal} // O'z ovozimiz aks-sado bermasligi uchun lokal muted, remote esa eshitiladi
            className={`w-full h-full object-cover transition-all duration-300 ${
              participant.isLocal && participant.isMirrored !== false
                ? 'transform -scale-x-100'
                : ''
            } ${participant.isBlurred ? 'filter blur-[4px]' : ''} ${
              participant.isVideoMuted || !participant.stream
                ? 'opacity-0 pointer-events-none'
                : 'opacity-100'
            }`}
          />

          {/* Fallback Avatar when camera is off */}
          {(participant.isVideoMuted || !participant.stream) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0e121d] via-[#080a11] to-[#040508] p-4">
              <Avatar
                name={participant.name}
                colorClass={participant.avatarColor}
                size={isSpotlight ? '2xl' : 'xl'}
                isSpeaking={isSpeaking}
              />
            </div>
          )}
        </>
      )}

      {/* Floating Indicators Overlay */}
      {participant.isHandRaised && (
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500 text-black font-bold rounded-xl sm:rounded-2xl flex items-center gap-1.5 shadow-lg shadow-amber-500/30 animate-bounce z-10">
          <Hand className="w-3.5 h-3.5 fill-current" />
          <span className="text-[10px] sm:text-xs">Qo&apos;l ko&apos;tardi</span>
        </div>
      )}

      {/* Pin Button */}
      {onTogglePin && (
        <button
          type="button"
          onClick={() => onTogglePin(participant.id)}
          className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-xl backdrop-blur-md border transition-all duration-200 z-10 ${
            isPinned
              ? 'bg-blue-600 border-blue-400 text-white opacity-100'
              : 'bg-black/50 border-white/10 text-gray-300 hover:text-white opacity-70 sm:opacity-0 group-hover:opacity-100'
          }`}
          title={isPinned ? 'Pinni bekor qilish' : 'Ekranga qadash (Pin)'}
        >
          {isPinned ? (
            <PinOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
        </button>
      )}

      {/* Bottom Name & Audio Visualizer Bar */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 max-w-[90%]">
          {participant.isAudioMuted ? (
            <div className="p-0.5 sm:p-1 rounded-lg bg-red-500/20 text-red-400">
              <MicOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          ) : (
            <AudioVisualizer
              level={participant.audioLevel}
              isMuted={participant.isAudioMuted}
              barCount={3}
            />
          )}
          <span className="text-[11px] sm:text-xs font-semibold text-white truncate">
            {participant.name} {participant.isLocal && '(Siz)'}
          </span>
        </div>
      </div>
    </div>
  );
}
