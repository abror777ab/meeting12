'use client';

import React from 'react';
import {
  Settings,
  X,
  Mic,
  Video,
  Volume2,
  Check,
  Radio,
} from 'lucide-react';
import { MediaDeviceState } from '@/types/meeting';

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MediaDeviceState;
  onSwitchAudioInput: (id: string) => void;
  onSwitchVideoInput: (id: string) => void;
  audioLevel: number;
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  devices,
  onSwitchAudioInput,
  onSwitchVideoInput,
  audioLevel,
}: DeviceSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Qurilma Sozlamalari</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Microphone Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mikrofon (Audio Input)</span>
            </label>
            <select
              value={devices.audioInputId}
              onChange={(e) => onSwitchAudioInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {devices.availableAudioInputs.length === 0 && (
                <option value="">Standart mikrofon</option>
              )}
              {devices.availableAudioInputs.map((d, index) => (
                <option key={d.deviceId || index} value={d.deviceId}>
                  {d.label || `Mikrofon ${index + 1}`}
                </option>
              ))}
            </select>

            {/* Live Audio Level Bar */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Ovoz signali:</span>
              <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Camera Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span>Kamera (Video Input)</span>
            </label>
            <select
              value={devices.videoInputId}
              onChange={(e) => onSwitchVideoInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {devices.availableVideoInputs.length === 0 && (
                <option value="">Standart veb-kamera</option>
              )}
              {devices.availableVideoInputs.map((d, index) => (
                <option key={d.deviceId || index} value={d.deviceId}>
                  {d.label || `Kamera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Noise suppression & HD Info */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-400" />
              <span>Avtomatik shovqinni bosish (Noise Suppression) faol</span>
            </p>
            <p className="text-[11px] text-blue-400/80">
              MeetPulse avtomatik ravishda ovoz aks-sadosini (Echo Cancellation) yo&apos;qotadi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Tayyor
          </button>
        </div>
      </div>
    </div>
  );
}
