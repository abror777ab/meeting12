'use client';

import React, { useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Search,
  VolumeX,
  UserPlus,
  Crown,
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';

export function ParticipantsSidebar() {
  const {
    participants,
    isParticipantsOpen,
    setIsParticipantsOpen,
    setIsInviteOpen,
    muteAllParticipants,
  } = useMeeting();

  const [search, setSearch] = useState('');

  if (!isParticipantsOpen) return null;

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="absolute inset-0 sm:static sm:w-80 lg:w-96 h-full bg-[#0a0d14]/98 sm:bg-gray-900/95 backdrop-blur-2xl sm:border-l border-white/10 flex flex-col z-40 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-black/20">
        <div>
          <h3 className="font-bold text-white text-base">
            Ishtirokchilar ({participants.length})
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-400">Onlayn foydalanuvchilar</p>
        </div>
        <button
          type="button"
          onClick={() => setIsParticipantsOpen(false)}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Top Actions: Search & Invite */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Ishtirokchini qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            className="flex-1 text-xs py-2 rounded-xl"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            Taklif qilish
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={muteAllParticipants}
            className="text-xs py-2 rounded-xl text-amber-300 hover:text-amber-200"
            title="Barcha ishtirokchilar ovozini o‘chirish"
          >
            <VolumeX className="w-3.5 h-3.5" />
            Hamma Mute
          </Button>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredParticipants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={p.name}
                colorClass={p.avatarColor}
                size="sm"
                isSpeaking={!p.isAudioMuted && p.audioLevel > 20}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {p.name}
                  </span>
                  {p.isLocal && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                      Siz
                    </span>
                  )}
                  {p.isHost && (
                    <span title="Xona egasi">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  {p.isAudioMuted ? 'Muted' : 'Speaking'}
                </span>
              </div>
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5">
              {p.isHandRaised && (
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 animate-bounce">
                  <Hand className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-1.5 rounded-lg ${
                  p.isAudioMuted
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-gray-300'
                }`}
              >
                {p.isAudioMuted ? (
                  <MicOff className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </div>

              <div
                className={`p-1.5 rounded-lg ${
                  p.isVideoMuted
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-gray-300'
                }`}
              >
                {p.isVideoMuted ? (
                  <VideoOff className="w-3.5 h-3.5" />
                ) : (
                  <Video className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
