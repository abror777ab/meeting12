'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MediaDeviceInfoState,
  VideoResolution,
  AudioProcessingConfig,
  VideoProcessingConfig,
} from '../types/meeting';
import { MediaStreamService } from '../services/media-stream.service';
import { AudioDspService } from '../services/audio-dsp.service';

export function useMediaDevices() {
  const [deviceState, setDeviceState] = useState<MediaDeviceInfoState>({
    audioInputDevices: [],
    videoInputDevices: [],
    audioOutputDevices: [],
    selectedAudioInputId: '',
    selectedVideoInputId: '',
    selectedAudioOutputId: '',
  });

  const [audioConfig, setAudioConfig] = useState<AudioProcessingConfig>({
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    micGain: 1.0,
    isTestingMic: false,
  });

  const [videoConfig, setVideoConfig] = useState<VideoProcessingConfig>({
    resolution: '720p',
    isMirrored: true,
    isBlurredBackground: false,
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  const audioDspRef = useRef<AudioDspService | null>(null);

  useEffect(() => {
    audioDspRef.current = new AudioDspService();
    return () => {
      audioDspRef.current?.cleanup();
    };
  }, []);

  // Qurilmalar ro'yxatini olish
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await MediaStreamService.getDevices();
      setDeviceState((prev) => ({
        ...prev,
        audioInputDevices: devices.audioInputs,
        videoInputDevices: devices.videoInputs,
        audioOutputDevices: devices.audioOutputs,
        selectedAudioInputId:
          prev.selectedAudioInputId || devices.audioInputs[0]?.deviceId || '',
        selectedVideoInputId:
          prev.selectedVideoInputId || devices.videoInputs[0]?.deviceId || '',
        selectedAudioOutputId:
          prev.selectedAudioOutputId || devices.audioOutputs[0]?.deviceId || '',
      }));
    } catch (err) {
      console.error('Qurilmalarni olishda xatolik:', err);
    }
  }, []);

  // Yangi oqimni olish / yangilash
  const initializeStream = useCallback(
    async (
      audioId?: string,
      videoId?: string,
      targetResolution: VideoResolution = videoConfig.resolution
    ) => {
      setIsLoading(true);
      setPermissionError(null);

      try {
        if (localStreamRef.current) {
          MediaStreamService.stopMediaStream(localStreamRef.current);
        }

        const stream = await MediaStreamService.getUserMedia(
          audioId || deviceState.selectedAudioInputId,
          videoId || deviceState.selectedVideoInputId,
          targetResolution
        );

        setLocalStream(stream);
        setIsAudioMuted(false);
        setIsVideoMuted(false);

        // DSP pipeline ulanadi
        if (audioDspRef.current) {
          audioDspRef.current.processStream(stream, audioConfig.micGain);
        }

        await refreshDevices();
      } catch (err: unknown) {
        console.warn('Kamera/mikrofon ruxsati berilmadi yoki xatolik yuz berdi:', err);
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Kamera yoki mikrofonga ruxsat berilmadi';
        setPermissionError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [deviceState.selectedAudioInputId, deviceState.selectedVideoInputId, videoConfig.resolution, audioConfig.micGain, refreshDevices]
  );

  // Audio mute/unmute
  const toggleAudio = useCallback(() => {
    if (!localStream) return;
    const nextState = !isAudioMuted;
    MediaStreamService.toggleAudioTrack(localStream, !nextState);
    setIsAudioMuted(nextState);
  }, [localStream, isAudioMuted]);

  // Video mute/unmute
  const toggleVideo = useCallback(() => {
    if (!localStream) return;
    const nextState = !isVideoMuted;
    MediaStreamService.toggleVideoTrack(localStream, !nextState);
    setIsVideoMuted(nextState);
  }, [localStream, isVideoMuted]);

  // Mikrofonni o'zgartirish
  const selectAudioInput = useCallback(
    async (deviceId: string) => {
      setDeviceState((prev) => ({ ...prev, selectedAudioInputId: deviceId }));
      await initializeStream(deviceId, deviceState.selectedVideoInputId);
    },
    [deviceState.selectedVideoInputId, initializeStream]
  );

  // Kamerani o'zgartirish
  const selectVideoInput = useCallback(
    async (deviceId: string) => {
      setDeviceState((prev) => ({ ...prev, selectedVideoInputId: deviceId }));
      await initializeStream(deviceState.selectedAudioInputId, deviceId);
    },
    [deviceState.selectedAudioInputId, initializeStream]
  );

  // Sifatni (Resolution) o'zgartirish
  const setResolution = useCallback(
    async (resolution: VideoResolution) => {
      setVideoConfig((prev) => ({ ...prev, resolution }));
      await initializeStream(
        deviceState.selectedAudioInputId,
        deviceState.selectedVideoInputId,
        resolution
      );
    },
    [deviceState.selectedAudioInputId, deviceState.selectedVideoInputId, initializeStream]
  );

  // Oyna rejimini (Mirror) almashtirish
  const toggleMirror = useCallback(() => {
    setVideoConfig((prev) => ({ ...prev, isMirrored: !prev.isMirrored }));
  }, []);

  // Orqa fon xiraligi (Virtual Blur)
  const toggleVirtualBlur = useCallback(() => {
    setVideoConfig((prev) => ({
      ...prev,
      isBlurredBackground: !prev.isBlurredBackground,
    }));
  }, []);

  // Mikrofon Gain (Balandlik) o'zgartirish
  const setMicGain = useCallback((gain: number) => {
    setAudioConfig((prev) => ({ ...prev, micGain: gain }));
    audioDspRef.current?.setGain(gain);
  }, []);

  // O'z ovozini sinash (Loopback Test)
  const toggleMicLoopback = useCallback(() => {
    setAudioConfig((prev) => {
      const nextTesting = !prev.isTestingMic;
      audioDspRef.current?.toggleMicLoopback(nextTesting);
      return { ...prev, isTestingMic: nextTesting };
    });
  }, []);

  // Karnayni test qilish
  const playSpeakerTestSound = useCallback(() => {
    audioDspRef.current?.playSpeakerTestSound();
  }, []);

  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };

    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      if (localStreamRef.current) {
        MediaStreamService.stopMediaStream(localStreamRef.current);
      }
    };
  }, [refreshDevices]);

  return {
    localStream,
    isAudioMuted,
    isVideoMuted,
    isLoading,
    permissionError,
    deviceState,
    audioConfig,
    videoConfig,
    toggleAudio,
    toggleVideo,
    selectAudioInput,
    selectVideoInput,
    setResolution,
    toggleMirror,
    toggleVirtualBlur,
    setMicGain,
    toggleMicLoopback,
    playSpeakerTestSound,
    initializeStream,
  };
}
