import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { QuestWheelComponent, WheelSector } from '../../components/quest-wheel/quest-wheel.component';
import {StompService} from "../../services/stomp.service";
import {RoomService} from "./room.service";

declare global {
  interface Window {
    _currentQuestionCtx?: any;
    _powerTrayWatch?: any;
    _spinInProgress?: any;
    _confettiContainer?: any;
    _confettiInterval?: any;
    _rematchTimeout?: any;
    _gameEnded?: any;
    showCardSelection?: any;
    ensureRoletaOpenIfIdle?: any;
    setupRoletaForTurn?: any;
    openRoletaModal?: any;
  }
}

export interface Sector {
  index: number;
  sector: string;
  color: string;
  iconUrl: string;
  id: string;
  label: string;
}

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(QuestWheelComponent) wheel?: QuestWheelComponent;

  roletaTravada: boolean = false;

  roletaComecouSpin(event: any) {
    this.roletaTravada = true;
  }

  temaSelecionado = "EL";

  themeModalOpen = false;
  selectedSector: WheelSector | null = null;
  private autoCloseTimer: any = null;

  useFreezeQuestions() { this.roomService.usePower('FREEZE_QUESTIONS', 'id') }
  useStealQuestion() { this.roomService.usePower('STEAL_QUESTION', 'id') }
  useMouseEscape() { this.roomService.usePower('MOUSE_ESCAPE', 'id') }
  useJumpScare() { this.roomService.usePower('JUMP_SCARE', 'id') }
  useVowelX() { this.roomService.usePower('VOWEL_X', 'id') }

  // opcional: tempo para fechar automaticamente (ms)
  autoCloseMs = 2200;

  onSpinStart() {
    // bloquear UI se necessário, mostrar "girando..."
    console.log('spin started');
    // ex: this.isSpinning = true;
  }

  onSpinEnd(result: { index: number; sector: WheelSector }) {
    console.log('spin ended', result);
    this.selectedSector = result.sector;
    this.openThemeModal();
    this.roletaTravada = false;
  }

  openThemeModal() {
    this.themeModalOpen = true;
    // auto-close after X ms
    if (this.autoCloseMs > 0) {
      if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = setTimeout(() => this.confirmTheme(), this.autoCloseMs);
    }
  }

  closeThemeModal() {
    if (this.autoCloseTimer) { clearTimeout(this.autoCloseTimer); this.autoCloseTimer = null; }
    this.themeModalOpen = false;
  }

  confirmTheme() {
    // chamado ao fechar (botão OK ou auto)
    this.closeThemeModal();

    // notificar backend que o tema foi exibido / aceito (exemplo STOMP)
    // this.stompService.send('/app/game/theme-shown', JSON.stringify({ categoryId: this.selectedSector?.id }));

    // seguir próximo passo do fluxo (ex: mostrar seleção de cartas)
    // this.startCardSelectionPhase();

    console.log('Tema confirmado:', this.selectedSector);
  }


  // Audio storage
  private SFX: Record<string, HTMLAudioElement> = {};

  // Game state (copied from original)
  private localPlayerId: number;
  private currentPlayer = 1;
  private points: { [k: number]: number } = { 1: 0, 2: 0 };
  private timer: any = null;
  private spectatorTimer: any = null;
  private timeLeft = 15;
  private usedCardsCache: { [k: number]: number[] } = { 1: [], 2: [] };
  private roundCount = 0;

  // intervals / handlers to cleanup
  private storageListener = (ev: StorageEvent) => { };
  private clickOutsideListener = (ev: MouseEvent) => { };
  private messageListener = (e: MessageEvent) => { };
  private powerTrayWatchInterval: any = null;

  // Example question bank (kept from original)
  private questions: any = {
    Science: [{ question: "Qual planeta é conhecido como o Planeta Vermelho?", answers: ["Vênus", "Marte", "Júpiter", "Saturno", "Mercúrio"], correct: 1 }],
    History: [{ question: "Quem descobriu a América?", answers: ["Cristóvão Colombo", "Fernão de Magalhães", "Américo Vespúcio", "James Cook", "Marco Polo"], correct: 0 }],
    Sports: [{ question: "Quantos jogadores tem um time de futebol?", answers: ["9", "10", "11", "12", "13"], correct: 2 }],
    Art: [{ question: "Quem pintou a Mona Lisa?", answers: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michelangelo", "Rembrandt"], correct: 2 }],
    Movies: [{ question: "Em qual filme aparece a frase 'I'll be back'?", answers: ["Rocky", "Predador", "Exterminador do Futuro", "Matrix", "Rambo"], correct: 2 }]
  };

  // keep references to timeouts to clear later
  private timeouts: any[] = [];

  constructor(private roomService: RoomService) {
    // Parse localPlayerId from query string (exact same logic as original)
    try {
      const p = new URLSearchParams(location.search).get('p') || '1';
      this.localPlayerId = Math.max(1, Math.min(2, parseInt(p, 10) || 1));
    } catch (e) {
      this.localPlayerId = 1;
    }

    // Bind storage listener so we can remove later
    this.storageListener = (ev: StorageEvent) => {
      try {
        if (!ev) return;
        if (ev.key === 'selectedAvatar' || ev.key === 'selectedAvatar1') {
          const newSrc = ev.newValue;
          const p1 = document.getElementById('player1-icon') as HTMLImageElement;
          if (p1 && newSrc) p1.src = newSrc;
        }
        if (ev.key === 'selectedAvatar2') {
          const newSrc = ev.newValue;
          const p2 = document.getElementById('player2-icon') as HTMLImageElement;
          if (p2 && newSrc) p2.src = newSrc;
        }
        // handle power events (e.g. jumpscare) saved through localStorage
        if (typeof ev.key === 'string' && ev.key.indexOf('power_') === 0) {
          try {
            const val = ev.newValue ? JSON.parse(ev.newValue) : null;
            if (!val) return;
            // only act when target is this player (payload.target)
            if (ev.key === 'power_jumpscare') {
              try {
                const payload = val as any;
                const target = Number(payload && payload.target);
                if (Number.isFinite(target) && target === this.localPlayerId) {
                  // show jumpscare overlay and play a random jumpscare SFX
                  try { this.triggerJumpScareEffect(); } catch (e) { }
                }
              } catch (e) { }
            }
          } catch (e) { }
        }
        // other storage reactions are handled by hydrateFromStorage / other handlers where needed
      } catch (e) { }
    };

    // click outside help popup
    this.clickOutsideListener = (e: MouseEvent) => {
      try {
        const helpBtn = document.getElementById('help-btn');
        const helpPopup = document.getElementById('help-popup');
        if (!helpBtn || !helpPopup) return;
        // @ts-ignore
        if (!helpBtn.contains(e.target) && !helpPopup.contains(e.target)) helpPopup.style.display = 'none';
      } catch (e) { }
    };

    // message listener for iframe / roleta messages
    this.messageListener = (e: MessageEvent) => {
      try {
        const data = e.data || {};
        if (data && data.type === 'roletaSpinStarted') {
          if (this.localPlayerId !== this.currentPlayer) return;
          try { window._spinInProgress = true; } catch (e) { }
          try { const cd = document.getElementById('cards'); if (cd) cd.style.display = 'none'; } catch (e) { }
          try {
            localStorage.setItem('sync_roleta_spin', JSON.stringify({ index: data.index, turns: data.turns, duration: data.duration, by: this.currentPlayer, at: Date.now() }));
          } catch (err) { }
          this.playSFX('roleta');
          return;
        }
        if (data && data.type === 'roletaResult') {
          try { window._spinInProgress = false; } catch (e) { }
          const category = data.category || '';
          const pointsValue = (typeof data.points === 'number' && data.points > 0) ? data.points : (Math.floor(Math.random() * 5) + 1);
          setTimeout(() => {
            try { const ro = document.getElementById('roleta-area'); if (ro) ro.style.display = 'none'; } catch (e) { }
            try { const cd = document.getElementById('cards'); if (cd) cd.style.display = 'block'; } catch (e) { }
            // hide modal
            try { this.hideModalRoleta(); } catch (e) { }
            const categoryMap: any = { 'Esportes': 'Sports', 'Ciências': 'Science', 'Artes': 'Art', 'Mundo': 'Movies', 'Sociedade': 'History', 'Aleatório': null };
            const mapped = categoryMap[category] || category;
            const cats = Object.keys(this.questions);
            const chosen = cats.includes(mapped) ? mapped : (cats[Math.floor(Math.random() * cats.length)]);
            if (this.localPlayerId === this.currentPlayer) {
              try { localStorage.setItem('sync_roleta', JSON.stringify({ category: chosen, wheelPoints: pointsValue, by: this.currentPlayer, at: Date.now() })); } catch (e) { }
            }
            try { this.showCardSelection(chosen, pointsValue); } catch (e) { }
            try { const btn = document.getElementById('openRoletaBtn') as HTMLButtonElement; if (btn) btn.disabled = true; } catch (e) { }
          }, 3000);
        }
      } catch (err) { console.warn('message handler error', err); }
    };
  }

  // -----------------------
  // Lifecycle
  // -----------------------
  ngOnInit(): void {
    // load audio immediately (serve from /assets)
    this.loadAudio('musica_quiz', 'assets/sons/musica_quiz.m4a', true, 0.32);
    this.loadAudio('roleta', 'assets/sons/roleta.m4a', false, 0.85);
    this.loadAudio('carta', 'assets/sons/carta.m4a', false, 0.9);
    this.loadAudio('resposta_correta', 'assets/sons/resposta_correta.m4a', false, 0.9);
    this.loadAudio('resposta_errada', 'assets/sons/resposta_errada.m4a', false, 0.9);
    this.loadAudio('cronometro', 'assets/sons/cronometro.m4a', true, 0.5);
    this.loadAudio('vencedor', 'assets/sons/vencedor.m4a', false, 0.95);
    this.loadAudio('derrota', 'assets/sons/derrota.m4a', false, 0.95);
    this.loadAudio('click', 'assets/sons/click.m4a', false, 0.9);
    this.loadAudio('erro', 'assets/sons/erro.m4a', false, 0.9);

    // load power-related SFX (poderes subfolder)
    this.loadAudio('poder_jumpscare_1', 'assets/sons/poderes/jumpscare 1.m4a', false, 0.95);
    this.loadAudio('poder_jumpscare_2', 'assets/sons/poderes/jumpscare 2.m4a', false, 0.95);
    this.loadAudio('poder_jumpscare_3', 'assets/sons/poderes/jumpscare 3.m4a', false, 0.95);

    // storage listener
    window.addEventListener('storage', this.storageListener);

    // message listener
    window.addEventListener('message', this.messageListener);
  }

  ngAfterViewInit(): void {
    // simulate DOMContentLoaded behavior
    try { this.playSFX('musica_quiz'); } catch (e) { }

    // attach help button logic
    try {
      const helpBtn = document.getElementById('help-btn');
      const helpPopup = document.getElementById('help-popup');
      if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', () => {
          try { helpPopup.style.display = helpPopup.style.display === 'flex' ? 'none' : 'flex'; } catch (e) { }
        });
      }
      document.addEventListener('click', this.clickOutsideListener);
    } catch (e) { }

    // back button (note: in Angular you may use routerLink; this keeps original behavior)
    try {
      const backBtn = document.getElementById('backBtn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.playSFX('click');
          try { window.location.href = 'players.html'; } catch (e) { }
        });
      }
    } catch (e) { }

    // init powers and UI watchers
    try { this.initFreezePower(); } catch (e) { }
    try { this.initRunawayPower(); } catch (e) { }
    try { this.initJumpScarePower(); } catch (e) { }
    try { this.initXBlockPower(); } catch (e) { }
    try { this.initStealPower(); } catch (e) { }

    // hydrate from storage and prepare UI
    try { this.maybeClearStaleState(); } catch (e) { }
    try { this.applyNewMatchSignal(); } catch (e) { }
    try { this.updateTurnUI(); } catch (e) { }
    try { this.hydrateFromStorage(); } catch (e) { }

    // ensure tray watch similar to original
    try {
      if (!window._powerTrayWatch) {
        window._powerTrayWatch = setInterval(() => {
          if (window._gameEnded) return;
          try {
            const tray = document.getElementById('power-tray');
            const qa = document.getElementById('question-area');
            const isQuestionVisible = qa && window.getComputedStyle(qa).display !== 'none';
            if (isQuestionVisible && tray && tray.style.display === 'none') {
              this.setPowerTrayVisible(true);
            }
          } catch (e) { }
        }, 600);
        this.powerTrayWatchInterval = window._powerTrayWatch;
      }
    } catch (e) { }

    // expose helper functions to window for compatibility with other scripts
    try { window.showCardSelection = this.showCardSelection.bind(this); } catch (e) { }
    try { window.ensureRoletaOpenIfIdle = this.ensureRoletaOpenIfIdle.bind(this); } catch (e) { }
    try { window.setupRoletaForTurn = this.setupRoletaForTurn.bind(this); } catch (e) { }
  }

  ngOnDestroy(): void {
    // remove listeners
    try { window.removeEventListener('storage', this.storageListener); } catch (e) { }
    try { window.removeEventListener('message', this.messageListener); } catch (e) { }
    try { document.removeEventListener('click', this.clickOutsideListener); } catch (e) { }

    // clear intervals/timeouts
    try { if (this.timer) clearInterval(this.timer); } catch (e) { }
    try { if (this.spectatorTimer) clearInterval(this.spectatorTimer); } catch (e) { }
    try { if (this.powerTrayWatchInterval) clearInterval(this.powerTrayWatchInterval); } catch (e) { }
    try { if (window._confettiInterval) { clearInterval(window._confettiInterval); window._confettiInterval = null; } } catch (e) { }
    try { if (window._rematchTimeout) { clearTimeout(window._rematchTimeout); window._rematchTimeout = null; } } catch (e) { }

    // stop audios
    try {
      Object.keys(this.SFX).forEach(k => {
        try { this.SFX[k].pause(); } catch (e) { }
      });
    } catch (e) { }

    // clear queued timeouts
    this.timeouts.forEach(t => { try { clearTimeout(t); } catch (e) { } });

    if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
  }

  // -----------------------
  // Audio helpers (kept behavior)
  // -----------------------
  private loadAudio(id: string, src: string, loop = false, volume = 1) {
    try {
      const a = new Audio(src);
      a.loop = !!loop;
      a.volume = volume;
      this.SFX[id] = a;
    } catch (e) { }
  }

  private playSFX(id: string) {
    try {
      const a = this.SFX[id];
      if (!a) return;
      a.currentTime = 0;
      // play may return promise
      a.play().catch(() => { });
    } catch (e) { }
  }

  private stopSFX(id: string) {
    try {
      const a = this.SFX[id];
      if (!a) return;
      a.pause();
    } catch (e) { }
  }

  // -----------------------
  // Powers / visual effects
  // -----------------------
  private triggerJumpScareEffect() {
    try {
      // choose a random jumpscare audio among loaded ones
      const candidates = ['poder_jumpscare_1', 'poder_jumpscare_2', 'poder_jumpscare_3'];
      const avail = candidates.filter(c => !!this.SFX[c]);
      if (avail.length > 0) {
        const pick = avail[Math.floor(Math.random() * avail.length)];
        try { this.playSFX(pick); } catch (e) { }
      }

      // Show randomized jumpscare image overlay from assets/jumpscare
      const overlay = document.createElement('div');
      overlay.id = 'jumpscare-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.background = 'rgba(0,0,0,0.85)';
      overlay.style.zIndex = '20000';
      const img = document.createElement('img');
      const pool = ['assets/jumpscare/jump1.jpg', 'assets/jumpscare/jump2.jpg', 'assets/jumpscare/jump3.jpg'];
      img.src = pool[Math.floor(Math.random() * pool.length)];
      img.style.maxWidth = '80%'; img.style.maxHeight = '80%'; img.style.borderRadius = '8px';
      img.style.boxShadow = '0 10px 40px rgba(0,0,0,0.8)';
      overlay.appendChild(img);
      document.body.appendChild(overlay);

      setTimeout(() => {
        try { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); } catch (e) { }
      }, 5000);
    } catch (e) { }
  }

  // -----------------------
  // Powers initialization (converted; DOM queries kept)
  // -----------------------
  private initFreezePower() {
    try {
      const freezeBtns = Array.from(document.querySelectorAll(`.power-btn.power-btn--freeze.local-only[data-player="${this.localPlayerId}"]`));
      freezeBtns.forEach((freezeBtn: Element) => {
        if (freezeBtn) {
          freezeBtn.addEventListener('click', () => {
            try {
              const qa = document.getElementById('question-area');
              const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
              if (!isQuestionVisible) return;
              if (this.localPlayerId === this.currentPlayer) return;
              const payload = { by: this.localPlayerId, target: this.currentPlayer, at: Date.now(), durationMs: 5000 };
              localStorage.setItem('power_freeze', JSON.stringify(payload));
            } catch (e) { }
          });
        }
      });
    } catch (e) { }
  }

  private initRunawayPower() {
    try {
      const localBtns = Array.from(document.querySelectorAll(`.powers-group .power-btn.local-only[data-player="${this.localPlayerId}"]`));
      const freeze = localBtns.find(b => b.classList.contains('power-btn--freeze'));
      const others = localBtns.filter(b => b !== freeze);
      const btn = others[0] as HTMLElement;
      if (btn) {
        if (!btn.id) btn.id = 'btn-runaway';
        btn.title = 'Questões fogem do mouse';
        btn.addEventListener('click', () => {
          try {
            const qa = document.getElementById('question-area');
            const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
            if (!isQuestionVisible) return;
            if (this.localPlayerId === this.currentPlayer) return;
            const ctx = (window as any)._currentQuestionCtx || {};
            if (!ctx || !ctx.at) return;
            const payload = { by: this.localPlayerId, target: this.currentPlayer, qAt: ctx.at, at: Date.now(), clicks: 4 };
            localStorage.setItem('power_runaway', JSON.stringify(payload));
          } catch (e) { }
        });
      }
    } catch (e) { }
  }

  private initJumpScarePower() {
    try {
      const localBtns = Array.from(document.querySelectorAll(`.powers-group .power-btn.local-only[data-player="${this.localPlayerId}"]`));
      const freeze = localBtns.find(b => b.classList.contains('power-btn--freeze'));
      const others = localBtns.filter(b => b !== freeze);
      const btn = others[1] as HTMLElement;
      if (btn) {
        if (!btn.id) btn.id = 'btn-jumpscare';
        if (!btn.title) btn.title = 'Jump Scare (5s)';
        btn.addEventListener('click', () => {
          try {
            const qa = document.getElementById('question-area');
            const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
            if (!isQuestionVisible) return;
            if (this.localPlayerId === this.currentPlayer) return;
            const ctx = (window as any)._currentQuestionCtx || {};
            if (!ctx || !ctx.at) return;
            const payload = { by: this.localPlayerId, target: this.currentPlayer, qAt: ctx.at, at: Date.now(), durationMs: 5000 };
            localStorage.setItem('power_jumpscare', JSON.stringify(payload));
          } catch (e) { }
        });
      }
    } catch (e) { }
  }

  private initXBlockPower() {
    try {
      const localBtns = Array.from(document.querySelectorAll(`.powers-group .power-btn.local-only[data-player="${this.localPlayerId}"]`));
      const freeze = localBtns.find(b => b.classList.contains('power-btn--freeze'));
      const others = localBtns.filter(b => b !== freeze);
      const btn = others[2] as HTMLElement;
      if (btn) {
        if (!btn.id) btn.id = 'btn-xmask';
        if (!btn.title) btn.title = 'X (5s)';
        btn.addEventListener('click', () => {
          try {
            const qa = document.getElementById('question-area');
            const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
            if (!isQuestionVisible) return;
            if (this.localPlayerId === this.currentPlayer) return;
            const ctx = (window as any)._currentQuestionCtx || {};
            if (!ctx || !ctx.at) return;
            const payload = { by: this.localPlayerId, target: this.currentPlayer, qAt: ctx.at, at: Date.now(), durationMs: 5000 };
            localStorage.setItem('power_xmask', JSON.stringify(payload));
          } catch (e) { }
        });
      }
    } catch (e) { }
  }

  private initStealPower() {
    try {
      const btn = document.getElementById('btn-steal') as HTMLElement;
      if (!btn) return;
      btn.addEventListener('click', () => {
        try {
          const qa = document.getElementById('question-area');
          const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
          if (!isQuestionVisible) return;
          if (this.localPlayerId === this.currentPlayer) return; // only opponent can steal
          const raw = localStorage.getItem('sync_question');
          if (!raw) return;
          const q = JSON.parse(raw || '{}');
          if (!q || !q.category) return;
          if (q.stolenFrom) { return; } // already stolen this question
          if (q.by === this.localPlayerId) return;
          q.stolenFrom = q.by;
          q.stolenBy = this.localPlayerId;
          q.by = this.localPlayerId;
          localStorage.setItem('sync_question', JSON.stringify(q));
          try { this.currentPlayer = this.localPlayerId; } catch (e) { }
          try { this.renderQuestionPayload(q); } catch (e) { }
          try { this.updateTurnUI(); } catch (e) { }
          try { this.setPowerTrayVisible(true); } catch (e) { }
        } catch (e) { }
      });
    } catch (e) { }
  }

  // -----------------------
  // Storage / match state helpers
  // -----------------------
  private clearMatchState() {
    try {
      const keys = ['sync_roleta', 'sync_roleta_spin', 'sync_card', 'sync_question', 'sync_answer', 'matchResult', 'goLobbyNow', 'rematchNow', 'rematchRequest', 'rematchResponse', 'used_cards', 'used_cards_1', 'used_cards_2'];
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) { }
  }

  private maybeClearStaleState() {
    try {
      if (sessionStorage.getItem('freshBoot') === '1') return;
      sessionStorage.setItem('freshBoot', '1');
      const now = Date.now();
      const get = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
      const q = get('sync_question');
      const r = get('sync_roleta');
      const s = get('sync_roleta_spin');
      const a = get('sync_answer');
      const m = get('matchResult');
      const recent = (o: any, ms: number) => o && typeof o.at === 'number' && (now - o.at) < ms;
      const hasActiveRecent = recent(q, 120000) || recent(r, 120000) || recent(s, 120000) || recent(a, 120000);
      if (m && !hasActiveRecent) {
        this.clearMatchState();
      }
    } catch (e) { }
  }

  private applyNewMatchSignal() {
    try {
      const nm = localStorage.getItem('newMatch');
      if (!nm) return;
      const appliedKey = 'newMatchApplied_' + this.localPlayerId;
      const already = localStorage.getItem(appliedKey);
      if (already === nm) return;
      this.clearMatchState();
      localStorage.setItem(appliedKey, nm);
    } catch (e) { }
  }

  // -----------------------
  // UI updates, renderers and timers (kept behavior)
  // -----------------------
  private englishToPt(cat: string) {
    const map: any = { 'Science': 'Ciências', 'History': 'Sociedade', 'Sports': 'Esportes', 'Art': 'Artes', 'Movies': 'Mundo' };
    return map[cat] || cat;
  }

  private renderQuestionPayload(payload: any) {
    try {
      if (!payload) return;
      const { category, question, answers, correct, pointsValue, by } = payload;
      try { this.currentPlayer = by || this.currentPlayer; } catch (e) { }

      try { const ro = document.getElementById('roleta-area'); if (ro) ro.style.display = 'none'; } catch (e) { }
      try { const cd = document.getElementById('cards'); if (cd) cd.style.display = 'block'; } catch (e) { }
      try { const cd = document.getElementById('cards'); if (cd) (cd as HTMLElement).style.pointerEvents = 'none'; } catch (e) { }

      const qa = document.getElementById('question-area');
      if (qa) qa.style.display = 'flex';
      this.playSFX('click');

      // ensure power tray visible multiple times like original
      try { this.setPowerTrayVisible(true); } catch (e) { }
      this.timeouts.push(setTimeout(() => { try { this.setPowerTrayVisible(true); } catch (e) { } }, 0));
      this.timeouts.push(setTimeout(() => { try { this.setPowerTrayVisible(true); } catch (e) { } }, 60));
      this.timeouts.push(setTimeout(() => { try { this.setPowerTrayVisible(true); } catch (e) { } }, 240));

      const turnTitle = document.getElementById('turn-title');
      const curTitle = document.getElementById('current-player-title');
      const nameEl = document.getElementById(`player${by}-name`);
      const byName = (nameEl && (nameEl.textContent)) ? nameEl.textContent : `Jogador ${by}`;
      if (this.localPlayerId === by) {
        if (turnTitle) turnTitle.textContent = 'Agora é sua vez, responda:';
      } else {
        if (turnTitle) turnTitle.textContent = 'Oponente está respondendo...';
      }
      if (curTitle) curTitle.textContent = `Jogador da vez: ${byName}`;

      try {
        const tray = document.getElementById('power-tray');
        if (tray) {
          tray.style.display = 'flex';
          tray.classList.remove('center', 'left', 'right');
          tray.classList.add('center');
          const isOpponentView = (this.localPlayerId !== by);
          const stealUsed = !!payload.stolenFrom;
          const localOnlyButtons = tray.querySelectorAll('.power-btn.local-only');
          localOnlyButtons.forEach((btn: Element) => {
            try {
              const btnPlayer = (btn as HTMLElement).getAttribute('data-player');
              btn.classList.remove('hidden-remote');
              (btn as HTMLElement).style.display = '';
              if (isOpponentView && btnPlayer === String(this.localPlayerId)) {
                (btn as HTMLButtonElement).disabled = false;
              } else {
                (btn as HTMLButtonElement).disabled = true;
              }
            } catch (e) { }
          });
          const stealBtn = tray.querySelector('#btn-steal') as HTMLButtonElement;
          if (stealBtn) {
            stealBtn.style.display = '';
            stealBtn.disabled = (!isOpponentView) || stealUsed;
          }
        }
      } catch (e) { }

      try {
        const catEl = document.getElementById('category');
        if (catEl) { catEl.classList.remove('centered-title'); catEl.innerText = ''; }
        const badge = document.getElementById('cat-badge');
        if (badge) { badge.style.display = 'inline-block'; badge.textContent = `Categoria: ${this.englishToPt(category)}`; }
      } catch (e) { }

      const qEl = document.getElementById('question');
      const ansDiv = document.getElementById('answers');
      if (qEl) qEl.textContent = question || '';
      if (ansDiv) {
        ansDiv.innerHTML = '';
        (answers || []).forEach((ans: string, idx: number) => {
          const btn = document.createElement('button');
          btn.innerText = ans;
          (btn as any).dataset.idx = String(idx);
          if (this.localPlayerId !== by) {
            btn.disabled = true;
          } else {
            btn.onclick = () => { if (this.localPlayerId !== this.currentPlayer) return; this.answerQuestion(idx === correct, pointsValue, category, idx, correct); };
          }
          ansDiv.appendChild(btn);
        });

        // apply freeze power if present
        try {
          const freezeRaw = localStorage.getItem('power_freeze');
          if (freezeRaw) {
            const f = JSON.parse(freezeRaw || '{}');
            if (f && f.target === this.currentPlayer && this.localPlayerId === this.currentPlayer) {
              const since = Date.now() - f.at;
              const remaining = (f.durationMs || 5000) - since;
              if (remaining > 0) {
                const btns = Array.from(ansDiv.querySelectorAll('button')) as HTMLButtonElement[];
                btns.forEach(b => b.disabled = true);
                this.timeouts.push(setTimeout(() => {
                  try {
                    const qa = document.getElementById('question-area');
                    const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
                    if (isQuestionVisible && this.currentPlayer === f.target) {
                      btns.forEach(b => b.disabled = false);
                    }
                  } catch (e) { }
                }, remaining));
              }
            }
          }
        } catch (e) { }
      }

      const startedAt = payload.at || Date.now();
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const remaining = Math.max(0, 15 - elapsed);

      try { (window as any)._currentQuestionCtx = { correct, pointsValue, category, by, at: startedAt, stolenFrom: payload.stolenFrom, stolenBy: payload.stolenBy }; } catch (e) { }

      if (this.localPlayerId === by) {
        try { clearInterval(this.timer); } catch (e) { }
        try { if (this.spectatorTimer) { clearInterval(this.spectatorTimer); this.spectatorTimer = null; } } catch (e) { }
        this.startTimerRemaining(remaining);
      } else {
        try { if (this.timer) { clearInterval(this.timer); } } catch (e) { }
        this.startSpectatorTimerRemaining(remaining);
      }
    } catch (e) { console.warn('renderQuestionPayload error', e); }
  }

  private updateTurnUI() {
    try {
      const qa = document.getElementById('question-area');
      const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
      const ro = document.getElementById('roleta-area');
      if (ro) {
        if (isQuestionVisible) { ro.style.display = 'none'; } else { ro.style.display = 'flex'; }
      }
      try {
        const el = document.getElementById('roletaIframe');
        const isIframe = el && el.tagName && el.tagName.toLowerCase() === 'iframe';
        // If a component exposes a global API (roletaAPI) use it, otherwise fallback to iframe postMessage
        const api = (window as any).roletaAPI;
        if (api && typeof api.setSpinEnabled === 'function') {
          try { api.setSpinEnabled(this.localPlayerId === this.currentPlayer); } catch (e) { }
        } else if (isIframe) {
          try { (el as HTMLIFrameElement).contentWindow!.postMessage({ type: 'setSpinEnabled', enabled: (this.localPlayerId === this.currentPlayer) }, '*'); } catch (e) { }
        }
        const overlay = document.getElementById('roletaOverlay');
        if (overlay) overlay.style.display = (this.localPlayerId === this.currentPlayer) ? 'none' : 'flex';
        if (el) { if (this.localPlayerId !== this.currentPlayer) el.classList.add('dim'); else el.classList.remove('dim'); }
      } catch (e) { }
      const btn = document.getElementById('openRoletaBtn') as HTMLButtonElement;
      if (btn) btn.disabled = isQuestionVisible || !(this.localPlayerId === this.currentPlayer);
      const waiting = document.getElementById('waiting-screen');
      const oppCat = document.getElementById('opponent-category');
      if (isQuestionVisible) {
        if (waiting) waiting.style.display = 'none';
        if (oppCat) oppCat.innerText = '';
        try { this.setPowerTrayVisible(true); } catch (e) { }
      } else {
        if (this.localPlayerId !== this.currentPlayer) {
          if (waiting) waiting.style.display = 'none';
          if (oppCat) oppCat.innerText = '';
          try { this.setPowerTrayVisible(false); } catch (e) { }
        } else {
          if (waiting) waiting.style.display = 'none';
          if (oppCat) oppCat.innerText = '';
          try { this.setPowerTrayVisible(false); } catch (e) { }
        }
      }
    } catch (e) { }
  }

  // -----------------------
  // Timer helpers
  // -----------------------
  private startTimerRemaining(remaining: number) {
    try {
      const timerText = document.getElementById('timer-text');
      const circle = document.getElementById('timer-circle') as unknown as SVGCircleElement | null;
      // keep original behavior simple: show remaining and tick
      this.timeLeft = remaining;
      try { if (timerText) timerText.textContent = String(this.timeLeft); } catch (e) { }
      try { if (this.timer) clearInterval(this.timer); } catch (e) { }
      this.timer = setInterval(() => {
        try {
          this.timeLeft -= 1;
          if (timerText) timerText.textContent = String(this.timeLeft);
          // optional: update circle stroke-dashoffset if desired (left as is)
          if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            // time ended behavior: simply clear for now (original uses answerQuestion flow)
          }
        } catch (e) { }
      }, 1000);
    } catch (e) { }
  }

  private startSpectatorTimerRemaining(remaining: number) {
    try {
      const timerText = document.getElementById('timer-text');
      this.timeLeft = remaining;
      try { if (timerText) timerText.textContent = String(this.timeLeft); } catch (e) { }
      try { if (this.spectatorTimer) clearInterval(this.spectatorTimer); } catch (e) { }
      this.spectatorTimer = setInterval(() => {
        try {
          this.timeLeft -= 1;
          if (timerText) timerText.textContent = String(this.timeLeft);
          if (this.timeLeft <= 0) {
            clearInterval(this.spectatorTimer);
          }
        } catch (e) { }
      }, 1000);
    } catch (e) { }
  }

  // -----------------------
  // Roleta adapter helpers (unify iframe vs component API)
  // -----------------------
  private getRoletaEl(): HTMLElement | null {
    try { return document.getElementById('roletaIframe'); } catch (e) { return null; }
  }

  private isRoletaIframe(el: any): el is HTMLIFrameElement {
    try { return !!(el && el.tagName && String(el.tagName).toLowerCase() === 'iframe'); } catch (e) { return false; }
  }

  private roletaSetSpinEnabled(enabled: boolean) {
    try {
      const api = (window as any).roletaAPI;
      const el = this.getRoletaEl();
      if (api && typeof api.setSpinEnabled === 'function') {
        try { api.setSpinEnabled(enabled); } catch (e) { }
        return;
      }
      if (this.isRoletaIframe(el)) {
        try { (el as HTMLIFrameElement).contentWindow!.postMessage({ type: 'setSpinEnabled', enabled }, '*'); } catch (e) { }
      }
    } catch (e) { }
  }

  private roletaResetWheel() {
    try {
      const api = (window as any).roletaAPI;
      const el = this.getRoletaEl();
      if (api && typeof api.resetWheel === 'function') {
        try { api.resetWheel(); } catch (e) { }
        return;
      }
      if (this.isRoletaIframe(el)) {
        try { (el as HTMLIFrameElement).contentWindow!.postMessage({ type: 'resetWheel' }, '*'); } catch (e) { }
      }
    } catch (e) { }
  }

  private roletaEnsureSrc() {
    try {
      const el = this.getRoletaEl();
      if (this.isRoletaIframe(el)) {
        try { (el as HTMLIFrameElement).src = '/roleta?_=' + Date.now(); } catch (e) { }
      }
    } catch (e) { }
  }

  private setRoletaDim(dim: boolean) {
    try { const el = this.getRoletaEl(); if (el) { if (dim) el.classList.add('dim'); else el.classList.remove('dim'); } } catch (e) { }
  }

  private setRoletaOverlayVisible(visible: boolean) {
    try { const overlay = document.getElementById('roletaOverlay'); if (overlay) overlay.style.display = visible ? 'flex' : 'none'; } catch (e) { }
  }

  // -----------------------
  // Roleta modal helpers (show/hide) - keep behavior
  // -----------------------
  private showModalRoleta() {
    try {
      const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement;
      if (iframe) {
        try { iframe.setAttribute('scrolling', 'no'); (iframe as any).style.overflow = 'hidden'; } catch (e) { }
      }
      try {
        const isMyTurn = (this.localPlayerId === this.currentPlayer);
        const overlay = document.getElementById('roletaOverlay');
        if (overlay) overlay.style.display = isMyTurn ? 'none' : 'flex';
        if (iframe) { if (isMyTurn) iframe.classList.remove('dim'); else iframe.classList.add('dim'); }
        try { iframe.contentWindow!.postMessage({ type: 'setSpinEnabled', enabled: isMyTurn }, '*'); } catch (e) { }
        try { iframe.contentWindow!.postMessage({ type: 'resetWheel' }, '*'); } catch (e) { }

      } catch (e) { }
    } catch (e) { }
  }

  private hideModalRoleta() {
    try {
      const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement;
      const overlay = document.getElementById('roletaOverlay');
      if (overlay) overlay.style.display = 'none';
      if (iframe) iframe.classList.remove('dim');
    } catch (e) { }
  }

  // -----------------------
  // ensureRoleta / setupRoleta (exposed)
  // -----------------------
  private ensureRoletaOpenIfIdle() {
    try {
      const qa = document.getElementById('question-area');
      const cards = document.getElementById('cards');
      const isQ = qa && window.getComputedStyle(qa).display !== 'none';
      const isC = cards && window.getComputedStyle(cards).display !== 'none';
      if (!isQ && !isC) {
        try { const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement; if (iframe) iframe.src = '/roleta?_=' + Date.now(); } catch (e) { }
        this.showModalRoleta();
        const sendSetup = () => {
          try {
            const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement;
            iframe.contentWindow!.postMessage(
              { type: 'setSpinEnabled', enabled: (this.localPlayerId === this.currentPlayer) },
              '*'
            );
          } catch (e) { }

          try {
            const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement;
            iframe.contentWindow!.postMessage(
              { type: 'resetWheel' },
              '*'
            );
          } catch (e) { }
        };
        try {
          const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement;
          if (!iframe || !iframe.contentWindow || iframe.contentDocument?.readyState !== 'complete') {
            if (iframe) {
              const onld = () => { try { sendSetup(); } catch (e) { } if (iframe) iframe.removeEventListener('load', onld); };
              iframe.addEventListener('load', onld);
            }
          } else {
            sendSetup();
          }
        } catch (e) { }
      }
    } catch (e) { }
  }

  private setupRoletaForTurn() {
    try {
      const iframe = document.getElementById('roletaIframe') as HTMLIFrameElement;
      if (!iframe) return;
      try {
        const qa = document.getElementById('question-area');
        const ro = document.getElementById('roleta-area');
        const isQuestionVisible = qa ? (window.getComputedStyle(qa).display !== 'none') : false;
        if (ro && !isQuestionVisible) { ro.style.display = 'flex'; }
      } catch (e) { }
      try { iframe.src = '/roleta?_=' + Date.now(); } catch (e) { }
      const sendSetup = () => {
       try {
  iframe.contentWindow!.postMessage(
    { type: 'setSpinEnabled', enabled: (this.localPlayerId === this.currentPlayer) },
    '*'
  );
} catch (e) {}
try {
  iframe.contentWindow!.postMessage(
    { type: 'resetWheel' },
    '*'
  );
} catch (e) {}
        try {
          const overlay = document.getElementById('roletaOverlay');
          if (overlay) overlay.style.display = (this.localPlayerId === this.currentPlayer) ? 'none' : 'flex';
          if (iframe) { if (this.localPlayerId !== this.currentPlayer) iframe.classList.add('dim'); else iframe.classList.remove('dim'); }
        } catch (e) { }
      };
      if (!iframe.contentWindow || (iframe.contentDocument && iframe.contentDocument.readyState !== 'complete')) {
        const onld = () => { try { sendSetup(); } catch (e) { } if (iframe) iframe.removeEventListener('load', onld); };
        iframe.addEventListener('load', onld);
      } else {
        sendSetup();
      }
    } catch (e) { }
  }

  // -----------------------
  // Card selection & game flow
  // -----------------------
  private showCardSelection(category: string, wheelPoints: number) {
    try { const ro = document.getElementById('roleta-area'); if (ro) ro.style.display = 'none'; } catch (e) { }
    try { this.setPowerTrayVisible(false); } catch (e) { }

    try { const badge = document.getElementById('cat-badge'); if (badge) { badge.style.display = 'none'; badge.textContent = ''; } } catch (e) { }
    const cardsDiv = document.getElementById('cards') as HTMLElement;
    if (!cardsDiv) return;
    cardsDiv.innerHTML = '';
    cardsDiv.style.pointerEvents = 'auto';
    try { cardsDiv.style.display = 'block'; } catch (e) { }

    const sideLeft = document.createElement('div');
    sideLeft.className = 'cards-side left';
    const sideRight = document.createElement('div');
    sideRight.className = 'cards-side right';
    const stackLeft = document.createElement('div');
    stackLeft.className = 'cards-stack';
    const stackRight = document.createElement('div');
    stackRight.className = 'cards-stack';
    const leftCol = document.createElement('div');
    leftCol.className = 'cards-col';
    const leftCol2 = document.createElement('div');
    leftCol2.className = 'cards-col';
    const rightCol = document.createElement('div');
    rightCol.className = 'cards-col';
    const rightCol2 = document.createElement('div');
    rightCol2.className = 'cards-col';
    stackLeft.appendChild(leftCol);
    stackLeft.appendChild(leftCol2);
    stackRight.appendChild(rightCol);
    stackRight.appendChild(rightCol2);
    sideLeft.appendChild(stackLeft);
    sideRight.appendChild(stackRight);
    cardsDiv.appendChild(sideLeft);
    cardsDiv.appendChild(sideRight);

    try {
      leftCol2.style.marginTop = '28px';
      rightCol.style.marginTop = '28px';
    } catch (e) { }

    try { (window as any)._shuffleClicks = 0; (window as any)._shuffleQAt = Date.now(); } catch (e) { }

    try {
      const titleEl = document.getElementById('category');
      if (titleEl) {
        titleEl.classList.add('centered-title');
        const arrow = (this.currentPlayer === 1) ? '⬅' : '➡';
        titleEl.innerText = `Jogador ${this.currentPlayer}, escolha uma carta  ${arrow}`;
        titleEl.style.fontSize = '28px';
        titleEl.style.fontWeight = '800';
        titleEl.style.letterSpacing = '0.5px';
        titleEl.style.textShadow = '0 0 10px rgba(255,215,0,0.4)';
      }
    } catch (e) { }

    let cardChosen = false;
    const myUsed = Array.isArray(this.usedCardsCache[this.currentPlayer]) ? this.usedCardsCache[this.currentPlayer] : [];
    const values = [1, 2, 3, 4, 5];
    const availableValues = values.filter(v => !myUsed.includes(v));
    const cardEls: HTMLElement[] = [];

    for (let i = 0; i < values.length; i++) {
      const makeCard = (val: number, forPlayer: number) => {
        const c = document.createElement('div');
        c.className = 'card';
        c.style.position = 'relative';
        (c as any).dataset.value = String(val);
        c.textContent = String(val);
        c.style.fontWeight = '800';
        c.style.color = '#FFFFFF';
        const usedArr = Array.isArray(this.usedCardsCache[forPlayer]) ? this.usedCardsCache[forPlayer] : [];
        if (usedArr.includes(val)) c.classList.add('card-used');
        if (usedArr.includes(val)) c.style.color = '#000';
        return c;
      };
      const val = values[i];
      const cardLeft = makeCard(val, 1);
      const cardRight = makeCard(val, 2);

      if (i < 3) { leftCol.appendChild(cardLeft); } else { leftCol2.appendChild(cardLeft); }
      if (i < 3) { rightCol2.appendChild(cardRight); } else { rightCol.appendChild(cardRight); }

      const interactiveCard = (this.localPlayerId === 2) ? cardRight : cardLeft;
      cardEls.push(interactiveCard);
    }

    if (availableValues.length === 0) {
      try {
        const payload = { category: category, pointsValue: wheelPoints || 1, by: this.currentPlayer, at: Date.now(), noCardAvailable: true };
        localStorage.setItem('sync_card', JSON.stringify(payload));
      } catch (e) { }
      this.timeouts.push(setTimeout(() => this.chooseCard(wheelPoints || 1, category), 300));
      return;
    }

    const onCardsClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement;
        const card = target.closest ? target.closest('.card') as HTMLElement : null;
        if (!card) return;
        if (this.localPlayerId !== this.currentPlayer) return;

        try {
          const inLeftSide = !!card.closest('.cards-side.left');
          if (this.currentPlayer === 1 && !inLeftSide) return;
          if (this.currentPlayer === 2 && inLeftSide) return;
        } catch (err) { }
        if (card.classList.contains('card-used')) return;
        if (cardChosen) return;
        cardChosen = true;
        try { this.timeouts.forEach(t => { try { clearTimeout(t); } catch (e) { } }); } catch (e) { }

        const cardValue = parseInt((card as any).dataset.value, 10);
        const pts = cardValue || wheelPoints || 1;
        this.playSFX('carta');

        try { card.classList.add('card-used'); card.style.color = '#000'; } catch (e) { }

        try {
          const arr = Array.isArray(this.usedCardsCache[this.currentPlayer]) ? this.usedCardsCache[this.currentPlayer] : [];
          if (!arr.includes(cardValue)) arr.push(cardValue);
          this.usedCardsCache[this.currentPlayer] = arr;
          localStorage.setItem('used_cards_' + this.currentPlayer, JSON.stringify(arr));
        } catch (e) { }
        try { localStorage.setItem('sync_card', JSON.stringify({ category: category, pointsValue: pts, by: this.currentPlayer, at: Date.now(), cardValue: cardValue })); } catch (e) { }

        cardsDiv.style.pointerEvents = 'none';
        cardsDiv.removeEventListener('click', onCardsClick as any);
        this.chooseCard(pts, category);
      } catch (e) { }
    };

    cardsDiv.addEventListener('click', onCardsClick as any);

    if (this.localPlayerId === this.currentPlayer) {
      const autoPickTimer = setTimeout(() => {
        try {
          if (cardChosen) return;
          const available = cardEls.filter(el => !el.classList.contains('card-used'));
          if (available.length === 0) {
            const pts = wheelPoints || 1;
            try { localStorage.setItem('sync_card', JSON.stringify({ category: category, pointsValue: pts, by: this.currentPlayer, at: Date.now(), noCardAvailable: true })); } catch (e) { }
            this.chooseCard(pts, category);
            return;
          }
          const picked = available[Math.floor(Math.random() * available.length)];
          cardChosen = true;
          const cardValue = parseInt((picked as any).dataset.value, 10);
          const pts = cardValue || wheelPoints || 1;
          this.playSFX('carta');
          try {
            const arr = Array.isArray(this.usedCardsCache[this.currentPlayer]) ? this.usedCardsCache[this.currentPlayer] : [];
            if (!arr.includes(cardValue)) arr.push(cardValue);
            this.usedCardsCache[this.currentPlayer] = arr;
            localStorage.setItem('used_cards_' + this.currentPlayer, JSON.stringify(arr));
          } catch (e) { }

          try { picked.classList.add('card-used'); picked.style.color = '#000'; } catch (e) { }
          try { localStorage.setItem('sync_card', JSON.stringify({ category: category, pointsValue: pts, by: this.currentPlayer, at: Date.now(), cardValue: cardValue })); } catch (e) { }

          cardsDiv.style.pointerEvents = 'none';
          this.chooseCard(pts, category);
        } catch (e) { }
      }, 5000);
      this.timeouts.push(autoPickTimer);
    }
  }

  private chooseCard(pts: number, category: string) {
    // Implementation kept simple — in original this triggers question generation/render
    try {
      // create question payload and store in localStorage (mimic original flow)
      const cat = category || Object.keys(this.questions)[Math.floor(Math.random() * Object.keys(this.questions).length)];
      const qset = this.questions[cat] || this.questions[Object.keys(this.questions)[0]];
      const q = (qset && qset.length) ? qset[Math.floor(Math.random() * qset.length)] : { question: 'Pergunta genérica', answers: ['A', 'B', 'C', 'D', 'E'], correct: 0 };
      const payload = { category: cat, question: q.question, answers: q.answers, correct: q.correct, pointsValue: pts, by: this.currentPlayer, at: Date.now() };
      try { localStorage.setItem('sync_question', JSON.stringify(payload)); } catch (e) { }
      this.renderQuestionPayload(payload);
      this.updateTurnUI();
    } catch (e) { }
  }

  // -----------------------
  // Hydration from storage / syncing (kept behavior)
  // -----------------------
  private hydrateFromStorage() {
    try {
      const parse = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch (e) { return null; } };
      const q = parse('sync_question');
      const a = parse('sync_answer');
      const r = parse('sync_roleta');
      const s = parse('sync_roleta_spin');
      const m = parse('matchResult');
      const uc1 = (() => { try { return JSON.parse(localStorage.getItem('used_cards_1') || '[]'); } catch (e) { return []; } })();
      const uc2 = (() => { try { return JSON.parse(localStorage.getItem('used_cards_2') || '[]'); } catch (e) { return []; } })();
      this.usedCardsCache = { 1: Array.isArray(uc1) ? uc1 : [], 2: Array.isArray(uc2) ? uc2 : [] };
      const getAt = (o: any) => (o && typeof o.at === 'number') ? o.at : 0;
      const latest = [q, a, r, s, m].filter(Boolean).sort((x: any, y: any) => getAt(y) - getAt(x))[0] || null;

      if (a && a.newPoints) {
        this.points[1] = a.newPoints[1] || 0; this.points[2] = a.newPoints[2] || 0;
        const p1El = document.getElementById('player1-points'); if (p1El) p1El.textContent = `${this.points[1]} pts`;
        const p2El = document.getElementById('player2-points'); if (p2El) p2El.textContent = `${this.points[2]} pts`;
      }

      if (latest === m && m && m.winnerId) {
        const winner = { id: m.winnerId, name: document.getElementById(`player${m.winnerId}-name`)?.textContent, pts: m.pts };
        if (this.localPlayerId === m.winnerId) {
          this.showFinalWinner(winner);
        } else if (this.localPlayerId === (m.winnerId === 1 ? 2 : 1)) {
          this.showLoserModal(m);
        }
        return;
      }

      if (latest === q && q && q.category) {
        this.currentPlayer = q.by || this.currentPlayer;
        this.renderQuestionPayload(q);
        this.updateTurnUI();
        try { this.setPowerTrayVisible(true); } catch (e) { }
        this.timeouts.push(setTimeout(() => { try { this.setPowerTrayVisible(true); } catch (e) { } }, 50));
        this.timeouts.push(setTimeout(() => { try { this.setPowerTrayVisible(true); } catch (e) { } }, 200));
        return;
      }

      if (latest === r && r && r.category) {
        this.currentPlayer = r.by || this.currentPlayer;
        try { this.setPowerTrayVisible(false); } catch (e) { }
        this.showCardSelection(r.category, r.wheelPoints || 1);
        this.updateTurnUI();
        return;
      }

      // fallback: update points/avatars if present
      try {
        const stored1 = localStorage.getItem('selectedAvatar1') || localStorage.getItem('selectedAvatar');
        const stored2 = localStorage.getItem('selectedAvatar2');
        if (stored1) {
          const p1 = document.getElementById('player1-icon') as HTMLImageElement;
          if (p1) p1.src = stored1;
        }
        if (stored2) {
          const p2 = document.getElementById('player2-icon') as HTMLImageElement;
          if (p2) p2.src = stored2;
        }
      } catch (e) { }

    } catch (e) { }
  }

  // -----------------------
  // Helpers for UI modals / rematch / confetti etc.
  // (kept behavior; trimmed to essential but preserved original calls)
  // -----------------------
  private showLoserModal(m: any) {
    try {
      // minimal implementation to preserve behavior
      // (Original created overlays; you can expand UI here)
      console.warn('showLoserModal not fully implemented; payload:', m);
    } catch (e) { }
  }

  private showFinalWinner(winner: any) {
    try {
      try { clearInterval(this.timer); } catch (e) { }
      try { if (this.spectatorTimer) { clearInterval(this.spectatorTimer); this.spectatorTimer = null; } } catch (e) { }
      try { window._gameEnded = true; } catch (e) { }
      try { document.getElementById('roleta-area')!.style.display = 'none'; } catch (e) { }
      try { document.getElementById('question-area')!.style.display = 'none'; } catch (e) { }
      try { document.getElementById('cards')!.style.display = 'none'; } catch (e) { }
      try { document.getElementById('waiting-screen')!.style.display = 'none'; } catch (e) { }

      try { this.setPowerTrayVisible(false); } catch (e) { }
      this.playSFX('vencedor');
      this.stopSFX('musica_quiz');

      // create a simple modal displaying the winner
      let modal = document.getElementById('finalWinnerModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'finalWinnerModal';
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(0,0,0,0.65)';
        modal.style.zIndex = '10000';
        const content = document.createElement('div');
        content.style.background = '#111';
        content.style.padding = '22px';
        content.style.borderRadius = '12px';
        content.style.border = '4px solid #FFD700';
        content.style.color = '#fff';
        content.innerText = `Vencedor: ${winner?.name || ('Jogador ' + winner?.id)} — ${winner?.pts || 0} pts`;
        modal.appendChild(content);
        document.body.appendChild(modal);
      }
    } catch (e) { }
  }

  private setPowerTrayVisible(visible: boolean) {
    try {
      const tray = document.getElementById('power-tray');
      if (tray) tray.style.display = visible ? 'flex' : 'none';
    } catch (e) { }
  }

  // -----------------------
  // Answer logic (simplified but preserves original hooks)
  // -----------------------
  private answerQuestion(isCorrect: boolean, pointsValue: number, category: string, idx: number, correctIdx: number) {
    try {
      // Minimal preserved behavior:
      const ansDiv = document.getElementById('answers');
      if (ansDiv) {
        const buttons = Array.from(ansDiv.querySelectorAll('button'));
        buttons.forEach(b => (b as HTMLButtonElement).disabled = true);
      }
      if (isCorrect) {
        this.playSFX('resposta_correta');
        this.points[this.localPlayerId] = (this.points[this.localPlayerId] || 0) + (pointsValue || 1);
        try { const el = document.getElementById(`player${this.localPlayerId}-points`); if (el) el.textContent = `${this.points[this.localPlayerId]} pts`; } catch (e) { }
      } else {
        this.playSFX('resposta_errada');
      }
      // push sync answer to localStorage similar to original
      try {
        localStorage.setItem('sync_answer', JSON.stringify({ by: this.localPlayerId, correct: isCorrect, idx, correctIdx, pointsValue, at: Date.now(), newPoints: this.points }));
      } catch (e) { }

      // finalize logic: round increments, winner checks, etc.
      try {
        this.roundCount += 1;
        if (this.checkForWinner()) return;
        this.finalizeIfRoundLimitOrWinner();
      } catch (e) { }
    } catch (e) { }
  }

  private checkForWinner() {
    const winScore = 15;
    if (this.points[1] >= winScore || this.points[2] >= winScore) {
      const winner = this.points[1] >= winScore ? { id: 1, name: document.getElementById('player1-name')?.textContent, pts: this.points[1] } : { id: 2, name: document.getElementById('player2-name')?.textContent, pts: this.points[2] };
      this.showFinalWinner(winner);
      return true;
    }
    return false;
  }

  // -----------------------
  // Misc: confetti, rematch helpers preserved (you can expand UI later)
  // -----------------------
  private finalizeIfRoundLimitOrWinner() {
    try {
      // já ganhou por pontos?
      if (this.points[1] >= 15 || this.points[2] >= 15) return;

      // limite de rounds (5 rounds)
      if (this.roundCount >= 5) {
        let winnerId;

        // empate → vitória do player 1
        if (this.points[1] === this.points[2]) {
          winnerId = 1;
        } else {
          winnerId = (this.points[1] > this.points[2]) ? 1 : 2;
        }

        const winner = {
          id: winnerId,
          name: document.getElementById(`player${winnerId}-name`)?.textContent || ('Jogador ' + winnerId),
          pts: this.points[winnerId]
        };

        this.showFinalWinner(winner);
      }
    } catch (e) { }
  }

  private randomColor() {
    const palette = ['#FFD700', '#FF5E5E', '#5EE0FF', '#8AFF8A', '#C686FF', '#FFB86B'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  private launchConfetti(count = 60) {
    try {
      const container = (document as any)._confettiContainer || document.createElement('div');
      container.className = 'confetti-container';
      for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        const left = Math.random() * 100;
        c.style.left = left + '%';
        c.style.background = this.randomColor();
        const dur = (Math.random() * 1.6 + 1.2).toFixed(2) + 's';
        c.style.animationDuration = dur;
        c.style.animationDelay = (Math.random() * 0.3) + 's';
        c.style.width = (6 + Math.random() * 8) + 'px';
        c.style.height = (10 + Math.random() * 18) + 'px';
        container.appendChild(c);
        setTimeout(() => { try { if (c && c.parentNode) c.parentNode.removeChild(c); } catch (e) { } }, (parseFloat(dur) * 1000) + 500);
      }
      if (!(document as any)._confettiContainer) { document.body.appendChild(container); setTimeout(() => { try { if (container && container.parentNode) container.parentNode.removeChild(container); } catch (e) { } }, 4500); }
    } catch (e) { }
  }

  // -----------------------
  // Rematch helpers (skeletons kept)
  // -----------------------
  private startRematchTimeout() {
    try {
      if ((window as any)._rematchTimeout) clearTimeout((window as any)._rematchTimeout);
      (window as any)._rematchTimeout = setTimeout(() => {
        try { localStorage.setItem('goLobbyNow', String(Date.now())); } catch (e) { }
      }, 7000);
    } catch (e) { }
  }

}
