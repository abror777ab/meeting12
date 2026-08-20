'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  UserPlus,
  Share2,
  LayoutGrid,
  Maximize2,
  Sparkles,
  Check,
  Copy,
} from 'lucide-react';
import { ViewMode } from '@/types/meeting';

interface MeetingHeaderProps {
  roomId: string;
  durationSeconds: number;
  participantCount: number;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenInvite: () => void;
  onAddDemoParticipants: () => void;
  isRecording?: boolean;
}

export function MeetingHeader({
  roomId,
  durationSeconds,
  participantCount,
  viewMode,
  onToggleViewMode,
  onOpenInvite,
  onAddDemoParticipants,
  isRecording = false,
}: MeetingHeaderProps) {
  const [isCopied, setIsCopied] = useState(false);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-20">
      {/* Left: Meeting Info & Timer */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
            MP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                {roomId}
              </h2>
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                <span>E2E Shifrlangan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Live Timer */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{formatDuration(durationSeconds)}</span>
        </div>

        {/* Recording Badge */}
        {isRecording && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1 rounded-lg animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="hidden sm:inline">REC</span>
          </div>
        )}
      </div>

      {/* Right: Quick actions (View toggle, Invite, Demo Bot trigger) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Add Demo Bot Participants Button */}
        <button
          type="button"
          onClick={onAddDemoParticipants}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all"
          title="Sinash uchun demo hamkasblarni taklif qilish"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>+ Demo Hamkasblar</span>
        </button>

        {/* View mode toggle */}
        <button
          type="button"
          onClick={() => onToggleViewMode(viewMode === 'grid' ? 'spotlight' : 'grid')}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition-all"
          title={viewMode === 'grid' ? "Spiker ko'rinishiga o'tish" : "Grid ko'rinishiga o'tish"}
        >
          {viewMode === 'grid' ? <Maximize2 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
        </button>

        {/* Copy Invite Link */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-all"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{isCopied ? 'Nusxalandi!' : 'Havolani nusxalash'}</span>
        </button>

        {/* Invite Dialog button */}
        <button
          type="button"
          onClick={onOpenInvite}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Taklif qilish</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-700 text-[10px]">
            {participantCount}
          </span>
        </button>
      </div>
    </header>
  );
}
