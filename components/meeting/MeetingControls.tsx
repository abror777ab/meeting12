'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  Hand,
  Smile,
  MessageSquare,
  Users,
  Settings,
  PhoneOff,
  PenTool,
  CircleDot,
  Radio,
} from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '👍', '👏', '🎉', '🔥', '🚀', '💡', '😂'];

interface MeetingControlsProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isRecording: boolean;
  isChatOpen: boolean;
  unreadChatCount: number;
  isParticipantsOpen: boolean;
  participantCount: number;
  isWhiteboardOpen: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onToggleRecording: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleWhiteboard: () => void;
  onOpenSettings: () => void;
  onSendReaction: (emoji: string) => void;
  onLeaveCall: () => void;
}

export function MeetingControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isHandRaised,
  isRecording,
  isChatOpen,
  unreadChatCount,
  isParticipantsOpen,
  participantCount,
  isWhiteboardOpen,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onToggleWhiteboard,
  onOpenSettings,
  onSendReaction,
  onLeaveCall,
}: MeetingControlsProps) {
  const [showReactions, setShowReactions] = useState(false);

  const handleSelectReaction = (emoji: string) => {
    onSendReaction(emoji);
    setShowReactions(false);
  };

  return (
    <div className="relative py-2.5 px-2 sm:px-4 flex items-center justify-center border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl z-30 pb-safe">
      {/* Floating Reactions Popup */}
      {showReactions && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 p-2 rounded-2xl glass-panel border border-slate-700 shadow-2xl flex items-center gap-1.5 animate-in fade-in zoom-in duration-200 z-50 max-w-[95vw] overflow-x-auto">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelectReaction(emoji)}
              className="w-10 h-10 rounded-xl hover:bg-slate-800 flex items-center justify-center text-xl transition-all transform hover:scale-125 active:scale-95 shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Bottom Control Bar */}
      <div className="flex items-center gap-1.5 sm:gap-3 max-w-4xl w-full justify-start sm:justify-center overflow-x-auto no-scrollbar py-0.5 px-1">
        {/* Audio / Mic Button */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isAudioEnabled
              ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
          }`}
          title={isAudioEnabled ? "Mikrofonni o'chirish (M)" : 'Mikrofonni yoqish (M)'}
        >
          {isAudioEnabled ? <Mic className="w-4 h-4 sm:w-5 sm:h-5" /> : <MicOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Video / Camera Button */}
        <button
          type="button"
          onClick={onToggleVideo}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isVideoEnabled
              ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
          }`}
          title={isVideoEnabled ? "Kamerani o'chirish (V)" : 'Kamerani yoqish (V)'}
        >
          {isVideoEnabled ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Screen Share Button */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isScreenSharing
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title={isScreenSharing ? "Ekran ulashishni to'xtatish" : 'Ekranni ulashish (Share Screen)'}
        >
          {isScreenSharing ? <MonitorOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <MonitorUp className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Hand Raise Button */}
        <button
          type="button"
          onClick={onToggleHandRaise}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isHandRaised
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 font-bold animate-bounce'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title={isHandRaised ? "Qo'lni tushirish" : "Qo'l ko'tarish (Hand Raise)"}
        >
          <Hand className={`w-4 h-4 sm:w-5 sm:h-5 ${isHandRaised ? 'fill-current' : ''}`} />
        </button>

        {/* Emoji Reactions Trigger */}
        <button
          type="button"
          onClick={() => setShowReactions(!showReactions)}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            showReactions
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title="Reaksiyalar va emojilar"
        >
          <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Whiteboard / Doska */}
        <button
          type="button"
          onClick={onToggleWhiteboard}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isWhiteboardOpen
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title="Interaktiv doska (Whiteboard)"
        >
          <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Meeting Recording Button */}
        <button
          type="button"
          onClick={onToggleRecording}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isRecording
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title={isRecording ? "Yozib olishni to'xtatish" : 'Meetingni yozib olish (Record)'}
        >
          {isRecording ? <Radio className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <CircleDot className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        <div className="h-6 w-px bg-slate-800 hidden sm:block shrink-0" />

        {/* Chat Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isChatOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title="Chat"
        >
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadChatCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[10px] animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Participants Drawer Toggle */}
        <button
          type="button"
          onClick={onToggleParticipants}
          className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
            isParticipantsOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
          }`}
          title="Qatnashuvchilar"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-medium text-[10px] border border-slate-700">
            {participantCount}
          </span>
        </button>

        {/* Device Settings Modal */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center transition-all shrink-0"
          title="Qurilma sozlamalari"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Leave / End Call Button */}
        <button
          type="button"
          onClick={onLeaveCall}
          className="px-3.5 sm:px-5 h-10 sm:h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/30 transition-all transform active:scale-95 shrink-0 ml-0.5"
          title="Meetingdan chiqish"
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xs">Chiqish</span>
        </button>
      </div>
    </div>
  );
}
