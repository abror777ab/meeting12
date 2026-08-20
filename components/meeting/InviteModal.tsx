'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  X,
  Copy,
  Check,
  Share2,
  Lock,
  Globe,
} from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export function InviteModal({ isOpen, onClose, roomId }: InviteModalProps) {
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedId, setIsCopiedId] = useState(false);

  if (!isOpen) return null;

  const meetingUrl = typeof window !== 'undefined' ? `${window.location.origin}/?room=${encodeURIComponent(roomId.trim().toLowerCase())}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopiedId(true);
    setTimeout(() => setIsCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Hamkasblarni taklif qilish</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Hamkasblaringiz va do&apos;stlaringiz ushbu havola yoki xona kodi orqali meetingga o&apos;z ismlari bilan to&apos;g&apos;ridan-to&apos;g&apos;ri kirishlari mumkin.
          </p>

          {/* Meeting Link Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Meeting Havolasi (URL)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={meetingUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono truncate select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all shrink-0"
              >
                {isCopiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedLink ? 'Nusxalandi' : 'Nusxa'}</span>
              </button>
            </div>
          </div>

          {/* Meeting Room ID Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>Xona Kodi (Room ID)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={roomId}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-purple-300 font-mono truncate select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyId}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-all shrink-0"
              >
                {isCopiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedId ? 'Nusxalandi' : 'Nusxa'}</span>
              </button>
            </div>
          </div>

          {/* Tip */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Xohlagan brauzerda (Chrome, Safari, Edge, Firefox) ochish mumkin.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
