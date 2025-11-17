import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private bgAudio?: HTMLAudioElement;
  private currentBgRoute: string | null = null;

  constructor(private router: Router) {
    try {
      // load background music but do not autoplay (browsers may block)
      this.bgAudio = new Audio('assets/sons/musica_inicio.m4a');
      this.bgAudio.preload = 'auto';
      this.bgAudio.loop = true;
      this.bgAudio.volume = 0.28;
    } catch (e) { }

    // Listen to route changes to automatically play/pause depending on route
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((ev: any) => {
      try {
        const url = ev.urlAfterRedirects || ev.url;
        this.currentBgRoute = url;
        // do not play on /roleta
        if (url && url.startsWith('/roleta')) {
          this.pause();
        } else {
          try {
            const p: any = this.playInternal();
            if (p && typeof p.catch === 'function') {
              p.catch(() => { this.setupInteractionFallback(); });
            }
          } catch (e) { this.setupInteractionFallback(); }
        }
      } catch (e) { }
    });
  }

  // internal play that returns the play() promise when available
  private playInternal(): any {
    try {
      if (!this.bgAudio) return null;
      return this.bgAudio.play();
    } catch (e) { return null; }
  }

  // public play wrapper (keeps previous behavior)
  play() {
    try { this.playInternal(); } catch (e) { }
  }

  pause() {
    try {
      if (!this.bgAudio) return;
      this.bgAudio.pause();
      this.bgAudio.currentTime = 0;
    } catch (e) { }
  }

  private setupInteractionFallback() {
    try {
      const tryPlay = () => {
        try { if (this.bgAudio) this.bgAudio.play().catch(() => {}); } catch (e) { }
      };
      // Try once on first user interaction
      window.addEventListener('click', tryPlay, { once: true });
      window.addEventListener('keydown', tryPlay, { once: true });
    } catch (e) { }
  }

  setVolume(v: number) {
    try { if (this.bgAudio) this.bgAudio.volume = v; } catch (e) { }
  }

  isPlaying() {
    try { return !!(this.bgAudio && !this.bgAudio.paused); } catch (e) { return false; }
  }
}
