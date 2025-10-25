class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioBlob = null;
    this.stream = null;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('녹음 시작 오류:', error);
      throw new Error('마이크 권한을 허용해주세요.');
    }
  }

  stop() {
    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

          // 스트림 정리
          if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
          }

          resolve(this.audioBlob);
        };
        this.mediaRecorder.stop();
      } else {
        resolve(null);
      }
    });
  }

  getAudioBlob() {
    return this.audioBlob;
  }

  getAudioURL() {
    return this.audioBlob ? URL.createObjectURL(this.audioBlob) : null;
  }
}
