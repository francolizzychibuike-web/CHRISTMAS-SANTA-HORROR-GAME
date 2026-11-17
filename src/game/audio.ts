class HorrorChristmasAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private soundEnabled = true;
  private musicEnabled = true;
  private isPaused = false;
  private isPlayingScene = false;
  private isChasing = false;
  private stormIntensity = 0.35;

  private stepIndex = 0;
  private musicTimer: number | null = null;

  public unlock(): void {
    if (typeof window === 'undefined') return;
    const ua = (navigator as unknown as { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.32 : 0;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.soundEnabled ? 0.65 : 0;
      this.sfxGain.connect(this.masterGain);

      this.setupWindLoop();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  private setupWindLoop(): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 340;
    this.windFilter.Q.value = 1.6;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0;

    noise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);
    noise.start();
  }

  public setSettings(soundEnabled: boolean, musicEnabled: boolean): void {
    this.soundEnabled = soundEnabled;
    this.musicEnabled = musicEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(soundEnabled && !this.isPaused ? 0.65 : 0, this.ctx.currentTime, 0.04);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(musicEnabled && !this.isPaused ? 0.32 : 0, this.ctx.currentTime, 0.05);
    }
    this.updateWindVolume();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (!this.ctx) return;
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(
        !paused && this.musicEnabled ? 0.32 : 0,
        this.ctx.currentTime,
        0.04,
      );
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(
        !paused && this.soundEnabled ? 0.65 : 0,
        this.ctx.currentTime,
        0.04,
      );
    }
    this.updateWindVolume();
  }

  public startSceneAudio(stormIntensity: number): void {
    this.unlock();
    this.isPlayingScene = true;
    this.isChasing = false;
    this.stormIntensity = stormIntensity;
    this.updateWindVolume();
    this.scheduleMusicLoop();
  }

  public stopSceneAudio(): void {
    this.isPlayingScene = false;
    this.isChasing = false;
    if (this.musicTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.updateWindVolume();
  }

  public setChaseMode(chasing: boolean): void {
    this.isChasing = chasing;
  }

  private updateWindVolume(): void {
    if (!this.windGain || !this.ctx) return;
    const target =
      this.isPlayingScene && !this.isPaused && this.soundEnabled
        ? 0.05 + this.stormIntensity * 0.14
        : 0;
    this.windGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  private scheduleMusicLoop(): void {
    if (typeof window === 'undefined') return;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }

    const tick = () => {
      if (!this.isPlayingScene) return;
      if (!this.isPaused && this.musicEnabled && this.ctx && this.musicGain) {
        this.playMusicStep(this.stepIndex++);
      }
      const intervalMs = this.isChasing ? 185 : 330;
      this.musicTimer = window.setTimeout(tick, intervalMs);
    };

    this.musicTimer = window.setTimeout(tick, 120);
  }

  private playMusicStep(step: number): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Creepy minor-key Carol of the Bells / Music Box motif (B minor)
    const motif = [493.88, 466.16, 493.88, 392.0, 493.88, 466.16, 493.88, 392.0, 587.33, 554.37, 493.88, 440.0, 493.88, 392.0, 369.99, 329.63];
    const freq = motif[step % motif.length];

    // Music-box chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(this.isChasing ? 0.14 : 0.1, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // Deep horror bass pulse every 2 steps (or every step during Chase)
    if (this.isChasing || step % 4 === 0) {
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bass.type = this.isChasing ? 'sawtooth' : 'sine';
      const bassFreq = step % 8 < 4 ? 123.47 : 98.0; // B2 / G2
      bass.frequency.setValueAtTime(bassFreq, now);
      bassGain.gain.setValueAtTime(this.isChasing ? 0.11 : 0.07, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + (this.isChasing ? 0.16 : 0.45));

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = this.isChasing ? 420 : 220;

      bass.connect(lp);
      lp.connect(bassGain);
      bassGain.connect(this.musicGain);
      bass.start(now);
      bass.stop(now + 0.48);
    }

    // Chase sleigh-bell heartbeat tick
    if (this.isChasing && step % 2 === 1) {
      const bell = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(2340, now);
      bGain.gain.setValueAtTime(0.04, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      bell.connect(bGain);
      bGain.connect(this.musicGain);
      bell.start(now);
      bell.stop(now + 0.07);
    }
  }

  private playTone(params: {
    freqStart: number;
    freqEnd?: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
    delay?: number;
  }): void {
    if (!this.soundEnabled || this.isPaused || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime + (params.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = params.type ?? 'sine';
    osc.frequency.setValueAtTime(params.freqStart, now);
    if (params.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, params.freqEnd), now + params.duration);
    }
    const vol = params.volume ?? 0.22;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + params.duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + params.duration + 0.02);
  }

  public playFootstep(): void {
    const jitter = 0.92 + Math.random() * 0.16;
    this.playTone({ freqStart: 120 * jitter, freqEnd: 55, duration: 0.055, type: 'triangle', volume: 0.09 });
  }

  public playJump(): void {
    const jitter = 0.94 + Math.random() * 0.12;
    this.playTone({ freqStart: 220 * jitter, freqEnd: 460 * jitter, duration: 0.14, type: 'sine', volume: 0.18 });
  }

  public playDoubleJump(): void {
    const jitter = 0.96 + Math.random() * 0.08;
    this.playTone({ freqStart: 350 * jitter, freqEnd: 710 * jitter, duration: 0.15, type: 'triangle', volume: 0.2 });
  }

  public playSlide(): void {
    this.playTone({ freqStart: 320, freqEnd: 110, duration: 0.18, type: 'sawtooth', volume: 0.1 });
  }

  public playPickup(kind: 'key' | 'bell' | 'present' | 'power'): void {
    if (kind === 'key') {
      this.playTone({ freqStart: 660, freqEnd: 880, duration: 0.12, type: 'triangle', volume: 0.22 });
      this.playTone({ freqStart: 990, freqEnd: 1320, duration: 0.2, type: 'sine', volume: 0.22, delay: 0.08 });
    } else if (kind === 'bell') {
      this.playTone({ freqStart: 1046, freqEnd: 1046, duration: 0.22, type: 'sine', volume: 0.16 });
    } else if (kind === 'present') {
      this.playTone({ freqStart: 523, duration: 0.12, type: 'triangle', volume: 0.2 });
      this.playTone({ freqStart: 659, duration: 0.12, type: 'triangle', volume: 0.2, delay: 0.09 });
      this.playTone({ freqStart: 784, duration: 0.25, type: 'triangle', volume: 0.24, delay: 0.18 });
    } else {
      this.playTone({ freqStart: 392, freqEnd: 784, duration: 0.24, type: 'sine', volume: 0.22 });
    }
  }

  public playDoorOpen(): void {
    this.playTone({ freqStart: 160, freqEnd: 240, duration: 0.22, type: 'square', volume: 0.14 });
    this.playTone({ freqStart: 320, freqEnd: 480, duration: 0.2, type: 'triangle', volume: 0.16, delay: 0.12 });
  }

  public playHide(): void {
    this.playTone({ freqStart: 180, freqEnd: 95, duration: 0.14, type: 'sine', volume: 0.16 });
  }

  public playSantaLaugh(): void {
    // Deep menacing Ho-Ho-Ho downward cadence
    this.playTone({ freqStart: 165, freqEnd: 120, duration: 0.16, type: 'sawtooth', volume: 0.22, delay: 0 });
    this.playTone({ freqStart: 145, freqEnd: 105, duration: 0.16, type: 'sawtooth', volume: 0.22, delay: 0.18 });
    this.playTone({ freqStart: 130, freqEnd: 75, duration: 0.26, type: 'sawtooth', volume: 0.26, delay: 0.36 });
  }

  public playEnemyTelegraph(): void {
    this.playTone({ freqStart: 280, freqEnd: 490, duration: 0.18, type: 'square', volume: 0.12 });
  }

  public playHurt(): void {
    this.playTone({ freqStart: 210, freqEnd: 65, duration: 0.28, type: 'sawtooth', volume: 0.28 });
  }

  public playCheckpoint(): void {
    this.playTone({ freqStart: 440, duration: 0.14, type: 'sine', volume: 0.18 });
    this.playTone({ freqStart: 660, duration: 0.24, type: 'sine', volume: 0.2, delay: 0.1 });
  }

  public playGameOver(): void {
    this.playTone({ freqStart: 220, freqEnd: 70, duration: 0.45, type: 'sawtooth', volume: 0.3 });
    this.playTone({ freqStart: 155, freqEnd: 55, duration: 0.65, type: 'sawtooth', volume: 0.28, delay: 0.22 });
  }

  public playVictory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone({ freqStart: n, duration: 0.24, type: 'triangle', volume: 0.22, delay: idx * 0.11 });
    });
  }
}

export const gameAudio = new HorrorChristmasAudio();
