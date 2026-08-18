'use client';

import React from 'react';
import {
  Mic,
  Video,
  Volume2,
  Sliders,
  Shield,
  FlipHorizontal,
  Sparkles,
  Headphones,
  Play,
  Check,
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { Modal } from '../common/Modal';
import { AudioVisualizer } from '../common/AudioVisualizer';
import { Button } from '../common/Button';
import { VideoResolution } from '../../types/meeting';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    deviceState,
    audioConfig,
    videoConfig,
    localAudioLevel,
    isAudioMuted,
    selectAudioInput,
    selectVideoInput,
    setResolution,
    toggleMirror,
    toggleVirtualBlur,
    setMicGain,
    toggleMicLoopback,
    playSpeakerTestSound,
  } = useMeeting();

  return (
    <Modal
      isOpen={isSettingsOpen}
      onClose={() => setIsSettingsOpen(false)}
      title="Professional Qurilma Sozlamalari"
      maxWidth="lg"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Section 1: Microphone & Audio DSP */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Mikrofon va Ovoz (Audio DSP)
            </h4>
            <AudioVisualizer level={localAudioLevel} isMuted={isAudioMuted} barCount={4} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">
              Mikrofon Uskunasi
            </label>
            <select
              value={deviceState.selectedAudioInputId}
              onChange={(e) => selectAudioInput(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {deviceState.audioInputDevices.map((device) => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                  className="bg-gray-900 text-white"
                >
                  {device.label || `Mikrofon (${device.deviceId.slice(0, 5)})`}
                </option>
              ))}
              {deviceState.audioInputDevices.length === 0 && (
                <option className="bg-gray-900 text-white">Standart mikrofon</option>
              )}
            </select>
          </div>

          {/* Mic Gain Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-300 font-medium">
              <span>Mikrofon sezgirligi (Gain)</span>
              <span className="text-blue-400 font-mono">
                {Math.round(audioConfig.micGain * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={audioConfig.micGain}
              onChange={(e) => setMicGain(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Test Mic Loopback */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-semibold text-white block">
                  O&apos;z ovozingizni sinash (Mic Test)
                </span>
                <span className="text-[10px] text-gray-400">
                  Quloqchin taqib ovozingizni eshitib ko&apos;ring
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant={audioConfig.isTestingMic ? 'controlDanger' : 'secondary'}
              size="sm"
              onClick={toggleMicLoopback}
              className="text-xs rounded-xl"
            >
              {audioConfig.isTestingMic ? 'To‘xtatish' : 'Sinash'}
            </Button>
          </div>
        </div>

        {/* Section 2: Camera & Video Quality */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Video className="w-4 h-4" />
            Kamera va Tasvir Sifati
          </h4>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">
              Kamera Uskunasi
            </label>
            <select
              value={deviceState.selectedVideoInputId}
              onChange={(e) => selectVideoInput(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {deviceState.videoInputDevices.map((device) => (
                <option
                  key={device.deviceId}
                  value={device.deviceId}
                  className="bg-gray-900 text-white"
                >
                  {device.label || `Kamera (${device.deviceId.slice(0, 5)})`}
                </option>
              ))}
              {deviceState.videoInputDevices.length === 0 && (
                <option className="bg-gray-900 text-white">Standart kamera</option>
              )}
            </select>
          </div>

          {/* Resolution Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-gray-300 font-medium">
              Video Sifati (Resolution)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1080p', '720p', '480p'] as VideoResolution[]).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    videoConfig.resolution === res
                      ? 'bg-blue-600 text-white shadow-md border border-blue-400/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {res === '1080p' ? 'Full HD (1080p)' : res === '720p' ? 'HD (720p)' : 'SD (480p)'}
                </button>
              ))}
            </div>
          </div>

          {/* Mirror & Blur Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={toggleMirror}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                videoConfig.isMirrored
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <FlipHorizontal className="w-4 h-4" />
                Oyna (Mirror)
              </span>
              {videoConfig.isMirrored && <Check className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={toggleVirtualBlur}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                videoConfig.isBlurredBackground
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Virtual Blur
              </span>
              {videoConfig.isBlurredBackground && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Section 3: Speaker Sound Test */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <div>
              <h4 className="text-xs font-semibold text-white">Karnay / Quloqchin Sinovi</h4>
              <p className="text-[10px] text-gray-400">Ovoz chiqishini tekshirish uchun bosing</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={playSpeakerTestSound}
            className="text-xs rounded-xl"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            Ohangni chalish
          </Button>
        </div>

        {/* Section 4: Filters status */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-around text-center text-gray-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Echo Cancellation
          </span>
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            High-Pass Filter
          </span>
        </div>
      </div>
    </Modal>
  );
}
