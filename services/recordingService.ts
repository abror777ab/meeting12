/**
 * RecordingService handles recording meeting audio/video streams using the MediaRecorder API.
 * Follows Single Responsibility Principle (SRP).
 */
export class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  get recording(): boolean {
    return this.isRecording;
  }

  startRecording(stream: MediaStream, onStopCallback?: (blobUrl: string) => void): boolean {
    if (this.isRecording) return false;
    if (!stream || stream.getTracks().length === 0) {
      console.warn('Cannot record empty stream');
      return false;
    }

    try {
      this.recordedChunks = [];
      const options: MediaRecorderOptions = {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4',
      };

      this.mediaRecorder = new MediaRecorder(stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        this.isRecording = false;

        // Auto trigger download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `meeting-recording-${dateStr}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 100);

        if (onStopCallback) {
          onStopCallback(url);
        }
      };

      this.mediaRecorder.start(1000); // 1-second chunks
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      this.isRecording = false;
      return false;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }
}

export const recordingService = new RecordingService();
