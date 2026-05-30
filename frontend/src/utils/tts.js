
class SpeechAssist {
  constructor() {
    this.enabled = true;
    this.audio = null;
    this.rate = 1.1; // Diperlambat sedikit agar terdengar lebih jelas
  }

  // Mendapatkan base URL untuk API TTS yang dinamis (support Vite dev & Production server)
  getApiBaseUrl() {
    const protocol = window.location.protocol;
    const host = window.location.host.includes('3000') || window.location.host.includes('5173') 
      ? 'localhost:8000' 
      : window.location.host;
    return `${protocol}//${host}/api/tts`;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  setRate(rate) {
    this.rate = rate;
    if (this.audio) {
      this.audio.playbackRate = this.rate;
    }
  }

  speak(text) {
    if (!this.enabled) return;

    // Hentikan suara sebelumnya jika masih berjalan agar tidak tumpang tindih
    this.cancel();

    try {
      // Menggunakan backend lokal FastAPI Piper TTS secara dinamis
      const baseUrl = this.getApiBaseUrl();
      const url = `${baseUrl}?text=${encodeURIComponent(text)}`;

      this.audio = new Audio(url);
      this.audio.playbackRate = this.rate;

      // Play audio (catch error jika browser memblokir autoplay)
      this.audio.play().catch(e => {
        console.warn("Google TTS Error (mungkin diblokir autoplay): ", e);
      });
    } catch (e) {
      console.warn("Sistem TTS Error: ", e);
    }
  }

  preload(text) {
    if (!this.enabled) return;
    const baseUrl = this.getApiBaseUrl();
    const url = `${baseUrl}?text=${encodeURIComponent(text)}`;
    // Panggil fetch agar backend memproses/mengembalikan cache ke browser secara diam-diam
    fetch(url).catch(() => { });
  }

  cancel() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0; // Kembalikan ke awal
      this.audio = null;
    }
  }
}

export const ttsAssist = new SpeechAssist();
