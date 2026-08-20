/**
 * MediaService manages getUserMedia, getDisplayMedia, and device querying.
 * Follows SRP and ISP (Interface Segregation Principle).
 */
export class MediaService {
  /**
   * Request user media stream (camera and/or microphone)
   */
  static async getUserMedia(constraints: {
    audio?: boolean | MediaTrackConstraints;
    video?: boolean | MediaTrackConstraints;
  }): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Media devices are not supported in this browser.');
    }
    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * Request screen capture stream
   */
  static async getDisplayMedia(
    options: DisplayMediaStreamOptions = { video: true, audio: true }
  ): Promise<MediaStream> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Screen sharing is not supported in this browser.');
    }
    return await navigator.mediaDevices.getDisplayMedia(options);
  }

  /**
   * Enumerate available cameras, microphones, and audio outputs
   */
  static async getDevices(): Promise<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
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
   * Stop all tracks in a MediaStream
   */
  static stopStream(stream?: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }

  /**
   * Toggle track enable/disable safely
   */
  static setTrackEnabled(stream: MediaStream | null | undefined, kind: 'audio' | 'video', enabled: boolean): void {
    if (!stream) return;
    const tracks = kind === 'audio' ? stream.getAudioTracks() : stream.getVideoTracks();
    tracks.forEach((track) => {
      track.enabled = enabled;
    });
  }
}
