import { Howl, Howler } from 'howler';

export type MusicTrack = 'town' | 'mentor' | 'interior';
export type SfxName = 'blip' | 'select' | 'cancel' | 'complete' | 'coin' | 'levelup' | 'step';

const BASE = import.meta.env.BASE_URL || '/';

const MUSIC_FILES: Record<MusicTrack, string> = {
  town: `${BASE}assets/music/theme_plain.ogg`,
  mentor: `${BASE}assets/music/theme_dream.ogg`,
  interior: `${BASE}assets/music/theme_lost_village.ogg`,
};

const SFX_FILES: Record<SfxName, { src: string; rate?: number; volumeScale?: number }> = {
  blip: { src: `${BASE}assets/sfx/text_blip.wav`, rate: 1.0, volumeScale: 0.45 },
  select: { src: `${BASE}assets/sfx/accept.wav`, rate: 1.0, volumeScale: 0.75 },
  cancel: { src: `${BASE}assets/sfx/cancel.wav`, rate: 1.0, volumeScale: 0.75 },
  complete: { src: `${BASE}assets/sfx/success.wav`, rate: 1.0, volumeScale: 0.9 },
  coin: { src: `${BASE}assets/sfx/coin.wav`, rate: 1.0, volumeScale: 0.8 },
  levelup: { src: `${BASE}assets/sfx/level_up.wav`, rate: 1.0, volumeScale: 1.0 },
  step: { src: `${BASE}assets/sfx/text_blip.wav`, rate: 0.65, volumeScale: 0.2 },
};

class AudioManager {
  private unlocked = false;
  private musicVolume = 0.6;
  private sfxVolume = 0.8;
  private currentTrack: MusicTrack | null = null;
  private desiredTrack: MusicTrack | null = null;
  private musicHowls: Partial<Record<MusicTrack, Howl>> = {};
  private sfxHowls: Partial<Record<SfxName, Howl>> = {};
  private duckTimeout: ReturnType<typeof setTimeout> | null = null;
  private wasPlayingBeforeHidden = false;
  private lastBlipAt = 0;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      const unlockHandler = () => {
        this.unlock();
      };
      window.addEventListener('pointerdown', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  }

  private isTestEnv(): boolean {
    return typeof window === 'undefined' || navigator.userAgent.includes('jsdom');
  }

  unlock(): void {
    if (this.unlocked) {
      if (this.desiredTrack && !this.currentTrack) {
        this.playMusic(this.desiredTrack);
      }
      return;
    }
    this.unlocked = true;
    if (!this.isTestEnv() && Howler.ctx && Howler.ctx.state === 'suspended') {
      void Howler.ctx.resume();
    }
    if (this.desiredTrack) {
      this.playMusic(this.desiredTrack);
    }
  }

  setVolumes(musicVolume: number, sfxVolume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, musicVolume));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));

    if (this.currentTrack) {
      const activeHowl = this.musicHowls[this.currentTrack];
      if (activeHowl) {
        activeHowl.volume(this.musicVolume);
        if (this.musicVolume === 0 && activeHowl.playing()) {
          activeHowl.pause();
        } else if (
          this.musicVolume > 0 &&
          !activeHowl.playing() &&
          this.unlocked &&
          (typeof document === 'undefined' || document.visibilityState === 'visible')
        ) {
          activeHowl.play();
        }
      }
    }
  }

  getVolumes(): { musicVolume: number; sfxVolume: number } {
    return { musicVolume: this.musicVolume, sfxVolume: this.sfxVolume };
  }

  playMusic(track: MusicTrack): void {
    this.desiredTrack = track;
    if (this.isTestEnv() || !this.unlocked) {
      return;
    }

    if (this.currentTrack === track) {
      const existing = this.musicHowls[track];
      if (existing && !existing.playing() && this.musicVolume > 0) {
        existing.volume(this.musicVolume);
        existing.play();
      }
      return;
    }

    // Fade out previous track if playing
    if (this.currentTrack) {
      const prev = this.musicHowls[this.currentTrack];
      if (prev && prev.playing()) {
        const prevVol = prev.volume();
        prev.fade(prevVol, 0, 350);
        setTimeout(() => {
          prev.stop();
        }, 360);
      }
    }

    this.currentTrack = track;
    let howl = this.musicHowls[track];
    if (!howl) {
      howl = new Howl({
        src: [MUSIC_FILES[track]],
        loop: true,
        volume: this.musicVolume,
        html5: false,
      });
      this.musicHowls[track] = howl;
    }

    if (this.musicVolume > 0) {
      howl.volume(0);
      howl.play();
      howl.fade(0, this.musicVolume, 400);
    }
  }

  stopMusic(): void {
    this.desiredTrack = null;
    if (this.currentTrack) {
      const active = this.musicHowls[this.currentTrack];
      active?.stop();
      this.currentTrack = null;
    }
  }

  playSfx(name: SfxName): void {
    if (this.isTestEnv() || this.sfxVolume <= 0) {
      return;
    }
    if (name === 'blip') {
      const now = performance.now();
      if (now - this.lastBlipAt < 45) {
        return;
      }
      this.lastBlipAt = now;
    }

    const cfg = SFX_FILES[name];
    let howl = this.sfxHowls[name];
    if (!howl) {
      howl = new Howl({
        src: [cfg.src],
        volume: this.sfxVolume * (cfg.volumeScale ?? 1),
        rate: cfg.rate ?? 1.0,
      });
      this.sfxHowls[name] = howl;
    } else {
      howl.volume(this.sfxVolume * (cfg.volumeScale ?? 1));
      howl.rate(cfg.rate ?? 1.0);
    }

    howl.play();
  }

  /**
   * Plays a celebratory jingle ('levelup' or 'complete') while ducking background music.
   */
  playJingle(name: 'levelup' | 'complete'): void {
    if (this.isTestEnv()) return;

    if (this.currentTrack && this.musicVolume > 0) {
      const activeMusic = this.musicHowls[this.currentTrack];
      if (activeMusic && activeMusic.playing()) {
        activeMusic.fade(activeMusic.volume(), this.musicVolume * 0.15, 150);
        if (this.duckTimeout) {
          clearTimeout(this.duckTimeout);
        }
        this.duckTimeout = setTimeout(() => {
          if (activeMusic.playing() && this.musicVolume > 0) {
            activeMusic.fade(activeMusic.volume(), this.musicVolume, 500);
          }
        }, 1800);
      }
    }

    this.playSfx(name);
  }

  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined' || !this.currentTrack) return;
    const active = this.musicHowls[this.currentTrack];
    if (!active) return;

    if (document.visibilityState === 'hidden') {
      if (active.playing()) {
        this.wasPlayingBeforeHidden = true;
        active.pause();
      } else {
        this.wasPlayingBeforeHidden = false;
      }
    } else if (document.visibilityState === 'visible') {
      if (this.wasPlayingBeforeHidden && this.musicVolume > 0 && this.unlocked) {
        active.play();
      }
    }
  };
}

export const audio = new AudioManager();
