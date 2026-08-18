export class MeetingRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  /**
   * Oqimni yozib olishni boshlash
   */
  public startRecording(stream: MediaStream): void {
    if (!stream || stream.getTracks().length === 0) {
      throw new Error('Yozib olish uchun faol media oqim topilmadi.');
    }

    this.recordedChunks = [];

    // Qo'llab-quvvatlanuvchi MIME turini aniqlash
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];

    let selectedMimeType = '';
    for (const type of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    try {
      if (selectedMimeType) {
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      } else {
        this.mediaRecorder = new MediaRecorder(stream);
      }
    } catch (e) {
      console.warn('MediaRecorder maxsus sozlama bilan ochilmadi, oddiy rejimga o‘tilmoqda:', e);
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event: Event) => {
      console.error('MediaRecorder xatoligi:', event);
    };

    this.mediaRecorder.start(1000); // Har 1 soniyada bo'laklash
  }

  /**
   * Yozib olishni to'xtatish va faylni avtomatik yuklab olish
   */
  public stopRecording(filename = `meeting-recording-${Date.now()}`): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') return;

    this.mediaRecorder.onstop = () => {
      if (this.recordedChunks.length === 0) {
        console.warn('Yozib olingan ma‘lumot topilmadi.');
        return;
      }

      const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(this.recordedChunks, { type: mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${filename}.${extension}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        try {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } catch {}
      }, 300);

      this.recordedChunks = [];
    };

    try {
      this.mediaRecorder.stop();
    } catch (e) {
      console.warn('MediaRecorder to‘xtatishda xatolik:', e);
    }
  }

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
