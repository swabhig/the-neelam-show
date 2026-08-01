export class AnswerRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(private stream: MediaStream) {}

  start() {
    this.chunks = [];
    // Safari records audio/mp4; Chrome records audio/webm - let the
    // browser pick its default supported type rather than forcing one.
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: this.mediaRecorder!.mimeType }));
      };
      this.mediaRecorder.stop();
    });
  }
}
