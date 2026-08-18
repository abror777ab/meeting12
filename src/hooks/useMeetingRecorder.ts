'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MeetingRecorderService } from '../services/recorder.service';

export function useMeetingRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorderRef = useRef<MeetingRecorderService | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    recorderRef.current = new MeetingRecorderService();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback((stream: MediaStream) => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.startRecording(stream);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Yozib olishni boshlashda xatolik:', err);
    }
  }, []);

  const stopRecording = useCallback((filename?: string) => {
    if (!recorderRef.current) return;

    recorderRef.current.stopRecording(filename);
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingDuration(0);
  }, []);

  const toggleRecording = useCallback(
    (stream: MediaStream | null, roomName = 'Meeting') => {
      if (isRecording) {
        stopRecording(`${roomName}-record-${new Date().toISOString().slice(0, 10)}`);
      } else if (stream) {
        startRecording(stream);
      }
    },
    [isRecording, startRecording, stopRecording]
  );

  return {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
