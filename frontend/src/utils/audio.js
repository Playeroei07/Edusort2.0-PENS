// Web Audio API Synthesizer for game sounds
// Eliminates the need for downloading external audio assets

class AudioSynth {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // Background Music Setup
    this.bgMusic = new Audio('/Toybox_Riot.mp3');
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.15; // Set volume very low to not overpower TTS
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.bgMusic) {
      this.bgMusic.muted = muted;
    }
  }

  playBGM() {
    if (!this.muted && this.bgMusic) {
      // Reset to beginning and play
      this.bgMusic.currentTime = 0;
      this.bgMusic.play().catch(e => console.warn("BGM autoplay blocked by browser: ", e));
    }
  }

  stopBGM() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  playSuccess() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;

    // Play a nice double-tone chord (C5 -> E5)
    this.playTone(523.25, 'sine', now, 0.1); // C5
    this.playTone(659.25, 'sine', now + 0.08, 0.2); // E5
  }

  playError() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;

    // Play a low buzz (G3 -> E-flat 3)
    this.playTone(196.00, 'sawtooth', now, 0.15, 0.1); // G3
    this.playTone(155.56, 'sawtooth', now + 0.1, 0.25, 0.1); // Eb3
  }

  playLevelUp() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6

    notes.forEach((freq, index) => {
      this.playTone(freq, 'sine', now + index * 0.08, 0.15, 0.15);
    });
  }

  playTick() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;
    // Short click
    this.playTone(800, 'triangle', now, 0.03, 0.05);
  }

  playGameOver() {
    if (this.muted) return;
    this.init();

    const now = this.ctx.currentTime;

    // Descending sad chord
    this.playTone(392.00, 'sine', now, 0.2); // G4
    this.playTone(349.23, 'sine', now + 0.15, 0.2); // F4
    this.playTone(311.13, 'sine', now + 0.3, 0.4); // Eb4
  }

  playTone(freq, type, startTime, duration, volume = 0.2) {
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth volume envelope to prevent clicking sounds
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn("Could not play sound: ", e);
    }
  }
}

export const gameAudio = new AudioSynth();
