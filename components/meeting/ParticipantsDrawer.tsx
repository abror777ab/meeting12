'use client';

import React, { useState } from 'react';
import {
  Users,
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Shield,
  VolumeX,
  UserPlus,
} from 'lucide-react';
import { Participant } from '@/types/meeting';

interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onOpenInvite: () => void;
}

export function ParticipantsDrawer({
  isOpen,
  onClose,
  participants,
  onOpenInvite,
}: ParticipantsDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handRaisedList = participants.filter((p) => p.isHandRaised);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm sm:hidden z-40"
        onClick={onClose}
      />

      <aside className="fixed sm:relative inset-x-0 bottom-0 sm:inset-auto h-[85dvh] sm:h-full w-full sm:w-80 lg:w-96 flex flex-col bg-slate-950 border-t sm:border-t-0 sm:border-l border-slate-800/80 shadow-2xl z-50 sm:z-40 transition-all duration-300 rounded-t-3xl sm:rounded-none overflow-hidden">
        {/* Mobile Pull Drag Bar */}
        <div className="w-12 h-1 bg-slate-700/60 rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Qatnashuvchilar ({participants.length})</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-800/60 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Hand Raised Queue Section if any */}
        {handRaisedList.length > 0 && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2">
              <Hand className="w-3.5 h-3.5 fill-current" />
              <span>Qo&apos;l ko&apos;targanlar ({handRaisedList.length})</span>
            </div>
            <div className="space-y-1.5">
              {handRaisedList.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] text-amber-400 font-mono">Navbatda</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {filtered.map((p) => {
            const initials = p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 transition-colors"
              >
                {/* User Avatar & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr ${
                      p.avatarColor || 'from-blue-600 to-indigo-600'
                    } flex items-center justify-center text-xs font-bold text-white shrink-0`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {p.name} {p.isLocal && '(Siz)'}
                      </p>
                      {p.isHost && (
                        <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                          Host
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {p.isLocal ? 'Mahalliy foydalanuvchi' : 'Qatnashuvchi'}
                    </p>
                  </div>
                </div>

                {/* Status Icons */}
                <div className="flex items-center gap-2 text-slate-400 shrink-0">
                  {p.isHandRaised && <Hand className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                  {p.isAudioEnabled ? (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  )}
                  {p.isVideoEnabled ? (
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Host Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2 shrink-0 pb-safe">
          <button
            type="button"
            onClick={onOpenInvite}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>A&apos;zo taklif qilish</span>
          </button>
        </div>
      </aside>
    </>
  );
}
