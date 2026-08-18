export class AudioDspService {
  private audioContext: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private gainNode: GainNode | null = null;
  private loopbackDestination: MediaStreamAudioDestinationNode | null = null;
  private isLoopbackActive = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;

        if (!AudioContextClass) return null;
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      return this.audioContext;
    } catch {
      return null;
    }
  }

  /**
   * Mikrofondan kelgan audio oqimga professional filtrlar qo'llaydi
   */
  public processStream(
    stream: MediaStream,
    gainMultiplier = 1.0
  ): MediaStreamAudioDestinationNode | null {
    try {
      const ctx = this.getContext();
      if (!ctx) return null;

      this.cleanup();

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return null;

      this.source = ctx.createMediaStreamSource(stream);

      // 1. High-Pass Filter (80Hz dan past past-chastotali shovqinlarni olib tashlash)
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'highpass';
      this.filter.frequency.setValueAtTime(80, ctx.currentTime);

      // 2. Dynamics Compressor (Ovoz balandligini bir maromda ushlab turish)
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, ctx.currentTime);

      // 3. Gain Node (Mikrofon kuchaytirgichi)
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(gainMultiplier, ctx.currentTime);

      // 4. Destination node for processed stream
      this.loopbackDestination = ctx.createMediaStreamDestination();

      // Pipeline zanjiri: Source -> Filter -> Compressor -> Gain -> Destination
      this.source.connect(this.filter);
      this.filter.connect(this.compressor);
      this.compressor.connect(this.gainNode);
      this.gainNode.connect(this.loopbackDestination);

      return this.loopbackDestination;
    } catch (err) {
      console.warn('Audio DSP qo‘llashda xatolik:', err);
      return null;
    }
  }

  /**
   * Mikrofon balandligi (Gain) ni o'zgartirish (0.0 dan 2.0 gacha)
   */
  public setGain(value: number): void {
    try {
      if (this.gainNode && this.audioContext) {
        this.gainNode.gain.setValueAtTime(
          Math.max(0, Math.min(2, value)),
          this.audioContext.currentTime
        );
      }
    } catch {}
  }

  /**
   * O'z ovozini quloqchinda eshitib sinash (Loopback test)
   */
  public toggleMicLoopback(enable: boolean): void {
    try {
      const ctx = this.getContext();
      if (!ctx || !this.gainNode) return;

      if (enable && !this.isLoopbackActive) {
        this.gainNode.connect(ctx.destination);
        this.isLoopbackActive = true;
      } else if (!enable && this.isLoopbackActive) {
        try {
          this.gainNode.disconnect(ctx.destination);
        } catch {}
        this.isLoopbackActive = false;
      }
    } catch {}
  }

  /**
   * Karnay/Quloqchinni sinash uchun yoqimli test ohangini chalish
   */
  public playSpeakerTestSound(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Speaker test ovozi chiqarilmadi:', e);
    }
  }

  public cleanup(): void {
    this.toggleMicLoopback(false);

    if (this.source) {
      try {
        this.source.disconnect();
      } catch {}
      this.source = null;
    }
  }
}
