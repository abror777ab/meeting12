'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Square,
  ShieldCheck,
  UserPlus,
  Video,
  Users,
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { VideoGrid } from './VideoGrid';
import { ControlBar } from './ControlBar';
import { ChatSidebar } from './ChatSidebar';
import { ParticipantsSidebar } from './ParticipantsSidebar';
import { ReactionOverlay } from './ReactionOverlay';
import { InviteModal } from './InviteModal';
import { SettingsModal } from './SettingsModal';

export function MeetingRoom() {
  const {
    roomId,
    participants,
    pinnedParticipantId,
    activeSpeakerId,
    viewMode,
    isParticipantsOpen,
    setIsParticipantsOpen,
    setPinnedParticipantId,
    setViewMode,
    setIsInviteOpen,
  } = useMeeting();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTogglePin = (id: string) => {
    if (pinnedParticipantId === id) {
      setPinnedParticipantId(null);
    } else {
      setPinnedParticipantId(id);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#07090e] text-white flex flex-col overflow-hidden select-none">
      {/* Top Bar Navigation */}
      <header className="h-14 px-3 sm:px-4 bg-[#0d1017]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-20 shrink-0">
        {/* Left: Room Badge & Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white hidden xs:inline">
              MeetConnect
            </span>
            <span className="text-gray-600 hidden xs:inline">|</span>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-blue-400 font-semibold transition-colors"
              title="Xona kodi (Ulashish uchun bosing)"
            >
              <span>{roomId}</span>
              <UserPlus className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Center: Layout View Toggles + Participant Counter Badge */}
        <div className="flex items-center gap-2">
          {/* Active Participants Badge */}
          <button
            type="button"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-300 transition-all shadow-sm"
            title="Qatnashuvchilar ro'yxati"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{participants.length} ishtirokchi</span>
          </button>

          <div className="hidden md:flex items-center gap-1 p-1 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setPinnedParticipantId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' && !pinnedParticipantId
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('spotlight')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'spotlight' || pinnedParticipantId
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Spotlight</span>
            </button>
          </div>
        </div>

        {/* Right: Security Badge & Live Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>P2P Shifrlangan</span>
          </div>

          <div className="text-xs font-mono font-medium text-gray-400">
            {currentTime}
          </div>
        </div>
      </header>

      {/* Center Body: Video Grid Area + Sidebars */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Main Video View */}
        <main className="flex-1 h-full relative overflow-hidden bg-gradient-to-b from-[#090c13] to-[#06070a]">
          <VideoGrid
            participants={participants}
            pinnedParticipantId={pinnedParticipantId}
            activeSpeakerId={activeSpeakerId}
            viewMode={viewMode}
            onTogglePin={handleTogglePin}
          />
        </main>

        {/* Chat Sidebar */}
        <ChatSidebar />

        {/* Participants Sidebar */}
        <ParticipantsSidebar />
      </div>

      {/* Bottom Controls Bar */}
      <ControlBar />

      {/* Floating Reactions Overlay */}
      <ReactionOverlay />

      {/* Modals */}
      <InviteModal />
      <SettingsModal />
    </div>
  );
}
