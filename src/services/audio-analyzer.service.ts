export class AudioAnalyzerService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private isAnalyzing = false;

  /**
   * Audio oqimni tinglash va real-time balandlikni callback orqali uzatish
   */
  public start(
    stream: MediaStream,
    onLevelChange: (level: number) => void
  ): void {
    try {
      this.stop();

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
        onLevelChange(0);
        return;
      }

      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;

      this.source = this.audioContext.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.isAnalyzing = true;

      const analyze = () => {
        if (!this.isAnalyzing || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }

        const average = sum / bufferLength;
        // Normalize to 0 - 100 scale
        const normalized = Math.min(100, Math.round((average / 128) * 100));

        onLevelChange(normalized);
        this.animationFrameId = requestAnimationFrame(analyze);
      };

      analyze();
    } catch (err) {
      console.warn('Audio analyzer ishga tushirilmadi:', err);
    }
  }

  /**
   * Tahlilni to'xtatish va resurslarni tozalash
   */
  public stop(): void {
    this.isAnalyzing = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyser = null;
  }
}
