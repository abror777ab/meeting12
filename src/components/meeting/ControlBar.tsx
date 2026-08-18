'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
  Users,
  Hand,
  Smile,
  Disc,
  PhoneOff,
  Settings2,
  UserPlus,
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { Button } from '../common/Button';
import { REACTION_EMOJIS } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';

export function ControlBar() {
  const {
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    isRecording,
    recordingDuration,
    isChatOpen,
    isParticipantsOpen,
    unreadCount,
    participants,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    toggleRecording,
    sendReaction,
    setIsChatOpen,
    setIsParticipantsOpen,
    setIsSettingsOpen,
    setIsInviteOpen,
    leaveRoom,
  } = useMeeting();

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  // Close emoji picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmojiPickerOpen]);

  const handleEmojiSelect = (emoji: string) => {
    sendReaction(emoji);
    setIsEmojiPickerOpen(false);
  };

  return (
    <div className="relative flex items-center justify-between px-2 sm:px-6 py-2.5 sm:py-3 bg-[#0a0d14]/95 backdrop-blur-2xl border-t border-white/10 z-30 shrink-0 gap-1 sm:gap-4">
      {/* Left Area: Recording Timer & Desktop Info */}
      <div className="flex items-center gap-2 min-w-0">
        {isRecording ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] sm:text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span>REC {formatDuration(recordingDuration)}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Xona Faol</span>
          </div>
        )}
      </div>

      {/* Center Area: Primary Call Controls (Touch & Responsive) */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Audio Mute */}
        <Button
          type="button"
          size="icon"
          variant={isAudioMuted ? 'controlDanger' : 'control'}
          onClick={toggleAudio}
          className="w-10 h-10 sm:w-12 sm:h-12"
          title={isAudioMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o‘chirish'}
        >
          {isAudioMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>

        {/* Video Mute */}
        <Button
          type="button"
          size="icon"
          variant={isVideoMuted ? 'controlDanger' : 'control'}
          onClick={toggleVideo}
          className="w-10 h-10 sm:w-12 sm:h-12"
          title={isVideoMuted ? 'Kamerani yoqish' : 'Kamerani o‘chirish'}
        >
          {isVideoMuted ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>

        {/* Screen Share */}
        <Button
          type="button"
          size="icon"
          variant={isScreenSharing ? 'controlActive' : 'control'}
          onClick={toggleScreenShare}
          className="w-10 h-10 sm:w-12 sm:h-12"
          title={isScreenSharing ? 'Ekranni to‘xtatish' : 'Ekranni ulashish (Share Screen)'}
        >
          <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        {/* Raise Hand */}
        <Button
          type="button"
          size="icon"
          variant={isHandRaised ? 'controlActive' : 'control'}
          onClick={toggleHandRaise}
          className="w-10 h-10 sm:w-12 sm:h-12"
          title={isHandRaised ? 'Qo‘lni tushirish' : 'Qo‘l ko‘tarish'}
        >
          <Hand className={`w-4 h-4 sm:w-5 sm:h-5 ${isHandRaised ? 'text-amber-500 fill-amber-500' : ''}`} />
        </Button>

        {/* Emoji Reactions Picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            size="icon"
            variant="control"
            onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
            className="w-10 h-10 sm:w-12 sm:h-12"
            title="Reaksiya bildirish"
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Emojis Popup */}
          {isEmojiPickerOpen && (
            <div className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 sm:p-2 bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 animate-in zoom-in-90 duration-150">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="p-1.5 sm:p-2 text-lg sm:text-xl hover:scale-125 transition-transform active:scale-95 rounded-xl hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Record Meeting */}
        <Button
          type="button"
          size="icon"
          variant={isRecording ? 'controlDanger' : 'control'}
          onClick={toggleRecording}
          className={`w-10 h-10 sm:w-12 sm:h-12 ${isRecording ? 'animate-pulse' : ''}`}
          title={isRecording ? 'Yozib olishni to‘xtatish' : 'Meetingni yozib olish (Record)'}
        >
          <Disc className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        {/* Leave Meeting */}
        <Button
          type="button"
          size="icon"
          variant="controlDanger"
          onClick={leaveRoom}
          title="Uchrashuvdan chiqish"
          className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-3 sm:px-5 w-auto h-10 sm:h-12"
        >
          <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline font-semibold text-xs ml-2">Chiqish</span>
        </Button>
      </div>

      {/* Right Area: Sidebars & Modals Triggers */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Invite button */}
        <Button
          type="button"
          size="icon"
          variant="control"
          onClick={() => setIsInviteOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12"
          title="Taklif qilish"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
        </Button>

        {/* Chat Toggle */}
        <div className="relative">
          <Button
            type="button"
            size="icon"
            variant={isChatOpen ? 'controlActive' : 'control'}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-10 h-10 sm:w-12 sm:h-12"
            title="Chat"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white font-bold rounded-full text-[9px] sm:text-[10px] flex items-center justify-center border-2 border-gray-900 animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Participants Toggle */}
        <div className="relative hidden xs:block">
          <Button
            type="button"
            size="icon"
            variant={isParticipantsOpen ? 'controlActive' : 'control'}
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="w-10 h-10 sm:w-12 sm:h-12"
            title="Ishtirokchilar"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <span className="absolute -top-1 -right-1 px-1 sm:px-1.5 py-0.2 sm:py-0.5 bg-gray-700 text-gray-200 font-bold rounded-full text-[9px] sm:text-[10px] border border-gray-600">
            {participants.length}
          </span>
        </div>

        {/* Settings */}
        <Button
          type="button"
          size="icon"
          variant="control"
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 sm:w-12 sm:h-12"
          title="Sozlamalar"
        >
          <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
}
