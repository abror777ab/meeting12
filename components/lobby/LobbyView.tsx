'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Settings,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { useMediaStream } from '@/hooks/useMediaStream';

interface LobbyViewProps {
  onJoinMeeting: (config: {
    userName: string;
    roomId: string;
    isAudioDefault: boolean;
    isVideoDefault: boolean;
  }) => void;
  initialRoomId?: string;
}

export function LobbyView({ onJoinMeeting, initialRoomId = '' }: LobbyViewProps) {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState(() => initialRoomId || 'daily-standup-' + Math.floor(1000 + Math.random() * 9000));
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinRoomInput, setJoinRoomInput] = useState('');

  const {
    stream,
    isAudioEnabled,
    isVideoEnabled,
    audioLevel,
    startMedia,
    toggleAudio,
    toggleVideo,
  } = useMediaStream({ initialAudio: true, initialVideo: true });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    startMedia();
  }, [startMedia]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
      setJoinRoomInput(initialRoomId);
      setActiveTab('join');
    }
  }, [initialRoomId]);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    let rawTarget = roomId;
    if (activeTab === 'join') {
      rawTarget = joinRoomInput.trim() || initialRoomId || roomId;
    } else {
      rawTarget = roomId.trim() || 'daily-standup-' + Math.floor(1000 + Math.random() * 9000);
    }
    const targetRoomId = rawTarget.trim().toLowerCase();

    onJoinMeeting({
      userName: userName.trim(),
      roomId: targetRoomId,
      isAudioDefault: isAudioEnabled,
      isVideoDefault: isVideoEnabled,
    });
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-[#090d16] overflow-y-auto">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                MeetPulse <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">HD Meeting</span>
              </h1>
              <p className="text-xs text-slate-400">Hamkasblar va do&apos;stlar bilan yuqori sifatli video qo&apos;ng&apos;iroqlar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 glass-panel px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">256-bit E2E Shifrlangan</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Left Column: Camera Preview Box */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl group">
              {isVideoEnabled && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror-video"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-blue-600/20 mb-3">
                    {userName ? userName.slice(0, 2).toUpperCase() : 'MP'}
                  </div>
                  <p className="text-sm font-medium text-slate-300">Kamera o&apos;chirilgan</p>
                  <p className="text-xs text-slate-500 mt-1">Siz boshqalarga avatar bilan ko&apos;rinasiz</p>
                </div>
              )}

              {/* Live Mic Waveform Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full z-10">
                <div className="flex items-end gap-0.5 h-3.5">
                  <span
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                    style={{ height: isAudioEnabled ? `${Math.max(4, audioLevel * 0.4)}px` : '4px' }}
                  />
                  <span
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                    style={{ height: isAudioEnabled ? `${Math.max(4, audioLevel * 0.8)}px` : '4px' }}
                  />
                  <span
                    className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                    style={{ height: isAudioEnabled ? `${Math.max(4, audioLevel * 0.6)}px` : '4px' }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-200">
                  {isAudioEnabled ? (audioLevel > 15 ? 'Gapiryapsiz' : 'Mikrofon faol') : 'Ovoz o‘chiq'}
                </span>
              </div>

              {/* In-Preview Quick Toggle Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    isAudioEnabled
                      ? 'bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700'
                      : 'bg-red-500/90 text-white hover:bg-red-600 border border-red-500'
                  }`}
                  title={isAudioEnabled ? "Mikrofonni o'chirish" : 'Mikrofonni yoqish'}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    isVideoEnabled
                      ? 'bg-slate-800/90 text-white hover:bg-slate-700 border border-slate-700'
                      : 'bg-red-500/90 text-white hover:bg-red-600 border border-red-500'
                  }`}
                  title={isVideoEnabled ? "Kamerani o'chirish" : 'Kamerani yoqish'}
                >
                  {isVideoEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Meeting ichida xohlagan payt mikrofon, video va ekranni almashishingiz mumkin
            </p>
          </div>

          {/* Right Column: Join / Create Meeting Form */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'create'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Yangi Meeting Ochish
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'join'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Xonaga Qo&apos;shilish
                </button>
              </div>

              {initialRoomId && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/40 text-blue-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-300">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
                  <span>
                    Siz <strong className="text-white font-mono">{initialRoomId}</strong> xonasiga taklif qilindingiz! Ismingizni kiriting va qo&apos;shiling.
                  </span>
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-4">
                {/* User Name Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ismingiz <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sardor Rahimov"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                  />
                </div>

                {activeTab === 'create' ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Xona kodi (Room ID)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-blue-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleCopyRoomId}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 text-xs font-medium transition-all"
                        title="Xona kodidan nusxa olish"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Qo&apos;shilmoqchi bo&apos;lgan Xona kodi <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Xona kodini kiriting..."
                      value={joinRoomInput}
                      onChange={(e) => setJoinRoomInput(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    />
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={!userName.trim()}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
                >
                  <span>{activeTab === 'create' ? "Meetingni Boshlash" : "Xonaga Kirish"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Feature Highlights */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-slate-400">
                <div className="flex flex-col items-center">
                  <Users className="w-4 h-4 text-blue-400 mb-1" />
                  <span className="text-[10px]">Cheksiz a&apos;zolar</span>
                </div>
                <div className="flex flex-col items-center">
                  <Sparkles className="w-4 h-4 text-purple-400 mb-1" />
                  <span className="text-[10px]">HD Screen Share</span>
                </div>
                <div className="flex flex-col items-center">
                  <Settings className="w-4 h-4 text-emerald-400 mb-1" />
                  <span className="text-[10px]">Interaktiv doska</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
