/**
 * AudioAnalyserService analyzes MediaStream audio tracks to calculate
 * real-time volume levels and detect active speaker states.
 * Adheres to Single Responsibility Principle (SRP).
 */
export class AudioAnalyser {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private onLevelChange?: (level: number, isSpeaking: boolean) => void;
  private threshold = 18; // Minimum volume to be considered speaking

  constructor(onLevelChange?: (level: number, isSpeaking: boolean) => void) {
    this.onLevelChange = onLevelChange;
  }

  attachStream(stream: MediaStream): void {
    this.detach();
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioContext = new AudioCtxClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.startLoop();
    } catch {
      // AudioContext init error fallback
    }
  }

  private startLoop = (): void => {
    if (!this.analyser || !this.dataArray) return;

    // TypeScript: Web Audio typed array compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = Math.round(sum / this.dataArray.length);
    const normalized = Math.min(100, Math.round((average / 128) * 100));
    const isSpeaking = normalized > this.threshold;

    if (this.onLevelChange) {
      this.onLevelChange(normalized, isSpeaking);
    }

    this.animationFrameId = requestAnimationFrame(this.startLoop);
  };

  detach(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.onLevelChange) {
      this.onLevelChange(0, false);
    }
  }
}
