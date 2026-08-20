'use client';

import React, { useRef, useEffect } from 'react';
import { Participant } from '@/types/meeting';
import { ParticipantTile } from './ParticipantTile';
import { Tv, Sparkles, X } from 'lucide-react';

interface ScreenShareSpotlightProps {
  presenter: Participant;
  participants: Participant[];
  onStopScreenShare?: () => void;
}

export function ScreenShareSpotlight({
  presenter,
  participants,
  onStopScreenShare,
}: ScreenShareSpotlightProps) {
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (screenVideoRef.current && presenter.screenStream) {
      screenVideoRef.current.srcObject = presenter.screenStream;
    }
  }, [presenter.screenStream]);

  return (
    <div className="flex-1 p-3 sm:p-4 flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-hidden h-full">
      {/* Main Screen Stream Showcase */}
      <div className="flex-1 flex flex-col h-full bg-black/90 rounded-2xl border border-blue-500/30 overflow-hidden relative shadow-2xl">
        {/* Presenter Info Bar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs text-white">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <Tv className="w-4 h-4 text-blue-400" />
          <span className="font-semibold">{presenter.name}</span>
          <span className="text-slate-400">ekran ulashmoqda</span>
        </div>

        {presenter.isLocal && onStopScreenShare && (
          <button
            type="button"
            onClick={onStopScreenShare}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-lg"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ulashishni to&apos;xtatish</span>
          </button>
        )}

        {/* Video Canvas for Screen Sharing */}
        <div className="flex-1 flex items-center justify-center p-2">
          {presenter.screenStream ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Ekran oqimi yuklanmoqda...</p>
            </div>
          )}
        </div>
      </div>

      {/* Participants Filmstrip on the Right/Bottom */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:w-72 shrink-0 py-1">
        {participants.map((participant) => (
          <div key={participant.id} className="w-52 sm:w-60 lg:w-full aspect-video shrink-0">
            <ParticipantTile
              participant={participant}
              isPinned={false}
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
