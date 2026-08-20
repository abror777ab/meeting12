'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MediaService } from '@/services/mediaService';
import { AudioAnalyser } from '@/services/audioAnalyserService';
import { MediaDeviceState } from '@/types/meeting';

interface UseMediaStreamOptions {
  initialAudio?: boolean;
  initialVideo?: boolean;
}

export function useMediaStream(options: UseMediaStreamOptions = {}) {
  const { initialAudio = true, initialVideo = true } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(initialAudio);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [devices, setDevices] = useState<MediaDeviceState>({
    audioInputId: '',
    videoInputId: '',
    audioOutputId: '',
    availableAudioInputs: [],
    availableVideoInputs: [],
    availableAudioOutputs: [],
  });

  const audioAnalyserRef = useRef<AudioAnalyser | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Keep refs synchronized with state
  streamRef.current = stream;
  screenStreamRef.current = screenStream;

  // Initialize audio analyser
  useEffect(() => {
    const analyser = new AudioAnalyser((level, speaking) => {
      setAudioLevel(level);
      setIsSpeaking(speaking);
    });
    audioAnalyserRef.current = analyser;

    return () => {
      analyser.detach();
    };
  }, []);

  // Update devices list
  const refreshDevices = useCallback(async () => {
    try {
      const { audioInputs, videoInputs, audioOutputs } = await MediaService.getDevices();
      setDevices((prev) => ({
        ...prev,
        availableAudioInputs: audioInputs,
        availableVideoInputs: videoInputs,
        availableAudioOutputs: audioOutputs,
        audioInputId: prev.audioInputId || audioInputs[0]?.deviceId || '',
        videoInputId: prev.videoInputId || videoInputs[0]?.deviceId || '',
        audioOutputId: prev.audioOutputId || audioOutputs[0]?.deviceId || '',
      }));
    } catch {
      // Ignore
    }
  }, []);

  // Start local camera and mic
  const startMedia = useCallback(
    async (audioInputId?: string, videoInputId?: string) => {
      try {
        setError(null);
        // Stop current stream if any
        if (streamRef.current) {
          MediaService.stopStream(streamRef.current);
        }

        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(audioInputId ? { deviceId: { exact: audioInputId } } : {}),
        };

        const constraints: MediaStreamConstraints = {
          audio: audioConstraints,
          video: videoInputId
            ? { deviceId: { exact: videoInputId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        };

        const newStream = await MediaService.getUserMedia(constraints);

        // Apply initial state
        newStream.getAudioTracks().forEach((t) => {
          t.enabled = isAudioEnabled;
        });
        newStream.getVideoTracks().forEach((t) => {
          t.enabled = isVideoEnabled;
        });

        setStream(newStream);
        audioAnalyserRef.current?.attachStream(newStream);
        await refreshDevices();
        return newStream;
      } catch (err: unknown) {
        console.error('Error starting media:', err);
        const errMsg = err instanceof Error ? err.message : 'Failed to access camera/microphone.';
        setError(errMsg);
        // Fallback to audio-only if video fails or vice-versa
        try {
          const audioOnlyStream = await MediaService.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          });
          audioOnlyStream.getAudioTracks().forEach((t) => {
            t.enabled = isAudioEnabled;
          });
          setStream(audioOnlyStream);
          audioAnalyserRef.current?.attachStream(audioOnlyStream);
          return audioOnlyStream;
        } catch {
          // Both failed
          return null;
        }
      }
    },
    [isAudioEnabled, isVideoEnabled, refreshDevices]
  );

  // Toggle Audio
  const toggleAudio = useCallback(async () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    const audioTracks = streamRef.current?.getAudioTracks() || [];
    if (audioTracks.length === 0 && next) {
      await startMedia(devices.audioInputId, devices.videoInputId);
    } else if (streamRef.current) {
      MediaService.setTrackEnabled(streamRef.current, 'audio', next);
    }
  }, [isAudioEnabled, startMedia, devices]);

  // Toggle Video
  const toggleVideo = useCallback(async () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);
    const videoTracks = streamRef.current?.getVideoTracks() || [];
    if (videoTracks.length === 0 && next) {
      await startMedia(devices.audioInputId, devices.videoInputId);
    } else if (streamRef.current) {
      MediaService.setTrackEnabled(streamRef.current, 'video', next);
    }
  }, [isVideoEnabled, startMedia, devices]);

  // Start Screen Sharing
  const startScreenShare = useCallback(async () => {
    try {
      if (screenStreamRef.current) {
        MediaService.stopStream(screenStreamRef.current);
      }

      const scrStream = await MediaService.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: true,
      });

      // Handle when user clicks browser native "Stop Sharing" button
      const videoTrack = scrStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      setScreenStream(scrStream);
      setIsScreenSharing(true);
      return scrStream;
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err);
      }
      setIsScreenSharing(false);
      return null;
    }
  }, []);

  // Stop Screen Sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      MediaService.stopStream(screenStreamRef.current);
      setScreenStream(null);
    }
    setIsScreenSharing(false);
  }, []);

  // Toggle Screen Sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // Change Audio Input Device
  const switchAudioInput = useCallback(
    async (deviceId: string) => {
      setDevices((prev) => ({ ...prev, audioInputId: deviceId }));
      await startMedia(deviceId, devices.videoInputId);
    },
    [devices.videoInputId, startMedia]
  );

  // Change Video Input Device
  const switchVideoInput = useCallback(
    async (deviceId: string) => {
      setDevices((prev) => ({ ...prev, videoInputId: deviceId }));
      await startMedia(devices.audioInputId, deviceId);
    },
    [devices.audioInputId, startMedia]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      MediaService.stopStream(streamRef.current);
      MediaService.stopStream(screenStreamRef.current);
      audioAnalyserRef.current?.detach();
    };
  }, []);

  return {
    stream,
    screenStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    audioLevel,
    isSpeaking,
    devices,
    error,
    startMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    switchAudioInput,
    switchVideoInput,
    refreshDevices,
  };
}
