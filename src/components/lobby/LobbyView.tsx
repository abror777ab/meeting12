'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Hash,
  ShieldCheck,
  Zap,
  Users,
  Mic,
  Sliders,
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { DeviceSettingsPreview } from './DeviceSettingsPreview';
import { Button } from '../common/Button';
import { SettingsModal } from '../meeting/SettingsModal';
import { ApiService } from '../../services/api.service';
import { AVATAR_COLORS } from '../../utils/constants';
import { generateRoomCode } from '../../utils/formatters';

interface LobbyViewProps {
  initialRoomId?: string;
}

export function LobbyView({ initialRoomId }: LobbyViewProps) {
  const {
    localStream,
    isAudioMuted,
    isVideoMuted,
    videoConfig,
    localAudioLevel,
    permissionError,
    toggleAudio,
    toggleVideo,
    toggleMirror,
    toggleVirtualBlur,
    initializeStream,
    joinRoom,
    setIsSettingsOpen,
  } = useMeeting();

  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState(initialRoomId || '');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [nameError, setNameError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    initializeStream();
  }, [initializeStream]);

  const handleCreateNewMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Iltimos, ismingizni kiriting');
      return;
    }

    setIsCreatingRoom(true);
    try {
      // 1. Backend REST API ga ulanib xona yaratishga urinish
      const backendRoom = await ApiService.createRoom(
        `Uchrashuv (${name.trim()})`,
        name.trim()
      );

      const targetCode = backendRoom?.roomCode || generateRoomCode();
      await joinRoom(targetCode, name.trim(), selectedColor);
    } catch {
      const fallbackCode = generateRoomCode();
      await joinRoom(fallbackCode, name.trim(), selectedColor);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinExistingMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Iltimos, ismingizni kiriting');
      return;
    }
    if (!roomIdInput.trim()) {
      return;
    }
    await joinRoom(roomIdInput.trim(), name.trim(), selectedColor);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-3 sm:p-6 lg:p-8 bg-[#07090e] text-white overflow-x-hidden">
      {/* Background glow ornaments */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-blue-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-indigo-600/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none" />

      {/* Header / Brand */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 sm:py-4 z-10">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <Video className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
              MeetConnect
            </h1>
            <span className="text-[10px] sm:text-xs text-blue-400/80 font-medium block">
              Spring Boot & WebRTC Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 backdrop-blur-md transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Sozlamalar</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>STOMP & P2P Shifrlangan</span>
          </div>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center z-10 my-4 sm:my-auto">
        {/* Left Side: Video Preview */}
        <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4">
          <DeviceSettingsPreview
            stream={localStream}
            name={name}
            avatarColor={selectedColor}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            isMirrored={videoConfig.isMirrored}
            isBlurred={videoConfig.isBlurredBackground}
            audioLevel={localAudioLevel}
            isLoading={!localStream && !permissionError}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleMirror={toggleMirror}
            onToggleBlur={toggleVirtualBlur}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {permissionError && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span>{permissionError} (Lekin xonaga kirishingiz mumkin)</span>
            </div>
          )}

          {/* Color Selector & Mic Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs text-gray-400 font-medium shrink-0">Avatar:</span>
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
                {AVATAR_COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr ${color} transition-all duration-200 shrink-0 ${
                      selectedColor === color
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>DSP Noise Suppression</span>
            </div>
          </div>
        </div>

        {/* Right Side: Join & Create Form */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6 p-5 sm:p-8 bg-gray-900/70 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" /> Tezkor ulanish
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Uchrashuvga kirish
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Hamkasblar va do&apos;stlaringiz bilan qulay va xavfsiz muloqot
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Sizning ismingiz
            </label>
            <input
              type="text"
              placeholder="Masalan: Sardor Komilov"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm font-medium"
            />
            {nameError && (
              <p className="text-xs text-red-400 font-medium">{nameError}</p>
            )}
          </div>

          {/* Action 1: Create New Room */}
          <Button
            type="button"
            variant="primary"
            size="lg"
            isLoading={isCreatingRoom}
            onClick={handleCreateNewMeeting}
            className="w-full flex items-center justify-center gap-2 text-sm sm:text-base py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-blue-600/30 font-semibold"
          >
            <PlusCircle className="w-5 h-5" />
            Yangi uchrashuv yaratish
          </Button>

          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-gray-900/90 px-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
              Yoki xona kodi bilan
            </span>
          </div>

          {/* Action 2: Join with Code */}
          <form onSubmit={handleJoinExistingMeeting} className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Xona kodi (masalan: abc-def-ghi)"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs sm:text-sm font-mono"
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              disabled={!roomIdInput.trim()}
              className="px-4 sm:px-5 rounded-2xl shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="block text-[11px] sm:text-xs font-bold text-white">Full HD</span>
              <span className="text-[9px] sm:text-[10px] text-gray-500">1080p Video</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="block text-[11px] sm:text-xs font-bold text-white">Spring Boot</span>
              <span className="text-[9px] sm:text-[10px] text-gray-500">STOMP Server</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02]">
              <span className="block text-[11px] sm:text-xs font-bold text-white">Screen Share</span>
              <span className="text-[9px] sm:text-[10px] text-gray-500">Audio bilan</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto py-2 sm:py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-gray-500 z-10 gap-2">
        <p>© 2026 MeetConnect Platform. Spring Boot & Next.js integratsiyasi.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            SOLID • DRY • KISS Arxitekturasi
          </span>
        </div>
      </footer>

      {/* Pre-join Settings Modal */}
      <SettingsModal />
    </div>
  );
}
