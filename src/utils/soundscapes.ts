/**
 * Web Audio API procedural soundscape generator for immersive audiobook listening.
 * Zero external audio downloads needed; generated entirely client-side.
 */

export interface SoundscapeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SOUNDSCAPES: SoundscapeOption[] = [
  { id: 'none', name: 'Silent / Pure Voice', description: 'Studio narration without background audio', icon: 'VolumeX' },
  { id: 'rain', name: 'Gentle Rain', description: 'Soothing rain on window panes with distant rumble', icon: 'CloudRain' },
  { id: 'fireplace', name: 'Cozy Fireplace', description: 'Warm crackling hearth and embers', icon: 'Flame' },
  { id: 'library', name: 'Victorian Library', description: 'Subtle grandfather clock ticking & air flow', icon: 'BookOpen' },
  { id: 'brown-noise', name: 'Deep Focus Noise', description: 'Warm low-frequency brown noise for deep immersion', icon: 'Waves' },
];

class SoundscapeManager {
  private ctx: AudioContext | null = null;
  private currentId: string = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.15; // subtle default volume

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrent(): string {
    return this.currentId;
  }

  public play(id: string) {
    this.stop();
    this.currentId = id;
    if (id === 'none') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (id === 'rain') {
      this.startRain();
    } else if (id === 'fireplace') {
      this.startFireplace();
    } else if (id === 'brown-noise') {
      this.startBrownNoise();
    } else if (id === 'library') {
      this.startLibrary();
    }
  }

  public stop() {
    this.activeNodes.forEach(node => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // Ignore disconnection errors
        }
      }
    });
    this.activeNodes = [];
    this.currentId = 'none';
  }

  private createPinkNoiseBuffer(durationSeconds = 5): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * durationSeconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createPinkNoiseBuffer(4);
    if (!noiseBuffer) return;

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Filter rain to sound like soft drops
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseNode.start();
    this.activeNodes.push(noiseNode, filter, gain);
  }

  private startBrownNoise() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain boost
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, filter);
  }

  private startFireplace() {
    if (!this.ctx || !this.masterGain) return;

    // Continuous rumble
    const rumbleSource = this.ctx.createBufferSource();
    const noiseBuffer = this.createPinkNoiseBuffer(3);
    if (noiseBuffer) {
      rumbleSource.buffer = noiseBuffer;
      rumbleSource.loop = true;

      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

      const rumbleGain = this.ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.6, this.ctx.currentTime);

      rumbleSource.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(this.masterGain);

      rumbleSource.start();
      this.activeNodes.push(rumbleSource, rumbleFilter, rumbleGain);
    }

    // Occasional crackles/pops
    const intervalId = window.setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      if (Math.random() > 0.4) {
        const osc = this.ctx.createOscillator();
        const crackleGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600 + Math.random() * 800, this.ctx.currentTime);

        crackleGain.gain.setValueAtTime(0.15 + Math.random() * 0.25, this.ctx.currentTime);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(crackleGain);
        crackleGain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
      }
    }, 180);

    this.activeNodes.push(intervalId);
  }

  private startLibrary() {
    if (!this.ctx || !this.masterGain) return;

    // Gentle clock tick every 1 second
    const intervalId = window.setInterval(() => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const tickGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);

      tickGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

      osc.connect(tickGain);
      tickGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }, 1000);

    this.activeNodes.push(intervalId);
  }
}

export const soundscapeManager = new SoundscapeManager();
