import { VideoResolution } from '../types/meeting';

export const RESOLUTION_CONSTRAINTS: Record<VideoResolution, MediaTrackConstraints> = {
  '480p': {
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24, max: 30 },
  },
  '720p': {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 },
  },
  '1080p': {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30, max: 60 },
  },
};

export const PROFESSIONAL_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export class MediaStreamService {
  /**
   * Foydalanuvchining kamera va mikrofon oqimini xavfsiz va moslashuvchan oladi
   */
  public static async getUserMedia(
    audioDeviceId?: string,
    videoDeviceId?: string,
    resolution: VideoResolution = '720p'
  ): Promise<MediaStream> {
    const audioConstraint: boolean | MediaTrackConstraints = audioDeviceId
      ? { ...PROFESSIONAL_AUDIO_CONSTRAINTS, deviceId: { ideal: audioDeviceId } }
      : PROFESSIONAL_AUDIO_CONSTRAINTS;

    const videoResolutionConstraint = RESOLUTION_CONSTRAINTS[resolution] || RESOLUTION_CONSTRAINTS['720p'];
    const videoConstraint: boolean | MediaTrackConstraints = videoDeviceId
      ? { ...videoResolutionConstraint, deviceId: { ideal: videoDeviceId } }
      : videoResolutionConstraint;

    // 1-urinish: Belgilangan parametrlar bilan
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: audioConstraint,
        video: videoConstraint,
      });
    } catch (err) {
      console.warn('Maxsus parametrlar bilan ruxsat berilmadi, standart oqimga urinilmoqda...', err);
    }

    // 2-urinish: Oddiy audio va video bilan
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
    } catch (err) {
      console.warn('Ikkala oqimni olishda xatolik, faqat audio yoki faqat videoga urinilmoqda...', err);
    }

    // 3-urinish: Faqat audio (agar kamera bo'lmasa)
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
    } catch {
      // 4-urinish: Faqat video (agar mikrofon bo'lmasa)
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      } catch {
        throw new Error(
          'Kamera yoki mikrofon topilmadi yoki ularga ruxsat berilmadi.'
        );
      }
    }
  }

  /**
   * Ekranni ulashish (Screen share) oqimini xavfsiz oladi
   */
  public static async getDisplayMedia(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Ekranni ulashish ushbu brauzerda qo‘llab-quvvatlanmaydi.');
    }

    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
        throw new Error('Ekranni ulashish bekor qilindi.');
      }
      throw err;
    }
  }

  /**
   * Ulangan barcha audio va video qurilmalarni qaytaradi
   */
  public static async getDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }

  /**
   * Audio trekni yoqish / o'chirish
   */
  public static toggleAudioTrack(stream: MediaStream | null, enabled: boolean): void {
    if (!stream) return;
    try {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    } catch {}
  }

  /**
   * Video trekni yoqish / o'chirish
   */
  public static toggleVideoTrack(stream: MediaStream | null, enabled: boolean): void {
    if (!stream) return;
    try {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    } catch {}
  }

  /**
   * Oqimni to'xtatish va barcha treklarni bo'shatish
   */
  public static stopMediaStream(stream: MediaStream | null): void {
    if (!stream) return;
    try {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    } catch {}
  }
}
