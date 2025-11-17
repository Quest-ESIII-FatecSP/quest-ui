import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-roleta',
  templateUrl: './roleta.component.html',
  styleUrls: ['./roleta.component.scss']
})
export class RoletaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('wheel', { static: true }) wheelRef!: ElementRef<SVGSVGElement>;
  @ViewChild('disco', { static: true }) discoRef!: ElementRef<HTMLDivElement>;
  @ViewChild('girar', { static: true }) girarBtnRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('resultModal', { static: true }) resultModalRef!: ElementRef<HTMLDivElement>;
  @ViewChild('modalImg', { static: true }) modalImgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('modalLabel', { static: true }) modalLabelRef!: ElementRef<HTMLDivElement>;

  readonly SIZE = 420;
  readonly N = 6;
  readonly offset = 0;

  readonly colors = ['#18a558','#8b4513','#0f7bff','#8b2be2','#ffd23a','#ff4d4d'];
  readonly labels = ['Esportes','Aleatório','Ciências','Sociedade','Mundo','Artes'];
  readonly pointsMap = [3,2,4,1,5,3];
  readonly images = [
    'assets/img/EL.png',
    'assets/img/V.png',
    'assets/img/CT.png',
    'assets/img/S.png',
    'assets/img/M.png',
    'assets/img/E.png'
  ];

  showingModal = false;
  modalImageSrc = '';
  modalLabelText = 'Resultado';

  private CX = this.SIZE/2;
  private CY = this.SIZE/2;
  private girando = false;
  private alvoGraus = 0;

  private idlePulseTimeout: any = null;
  private transitionEndUnlisten?: () => void;
  private messageUnlisten?: () => void;

  constructor(private renderer: Renderer2, private host: ElementRef) {}

  ngOnInit(): void {
    // Attach message listener to support external control
    const handler = (ev: MessageEvent) => {
      const d: any = (ev && ev.data) || {};
      if (d && d.type === 'spinNow') {
        const idx = Number(d.index) || 0; const t = Number(d.turns) || 6; const ms = Number(d.duration) || 6000;
        this.girarParaIndiceComParams(idx, t, ms);
      }
      if (d && d.type === 'setSpinEnabled') {
        try { this.girarBtnRef.nativeElement.disabled = !d.enabled; } catch {}
      }
      if (d && d.type === 'resetWheel') {
        try {
          this.hideModal();
          const svg = this.wheelRef.nativeElement;
          const btn = this.girarBtnRef.nativeElement;
          const disco = this.discoRef.nativeElement;
          svg.style.transition = 'none';
          svg.style.transform = 'rotate(0deg)';
          // force reflow then allow transitions again
          void (svg as any).offsetHeight;
          svg.style.transition = '';
          this.alvoGraus = 0;
          btn.disabled = false;
          disco.classList.add('idle');
        } catch {}
      }
    };
    window.addEventListener('message', handler);
    this.messageUnlisten = () => window.removeEventListener('message', handler);

    // Expose light API
    (window as any).roletaAPI = {
      spinTo: (i: number, t: number, ms: number) => this.girarParaIndiceComParams(i, t, ms),
      setSpinEnabled: (enabled: boolean) => { try { this.girarBtnRef.nativeElement.disabled = !enabled; } catch {} }
    };
  }

  ngAfterViewInit(): void {
    const svg = this.wheelRef.nativeElement;
    svg.setAttribute('viewBox', `0 0 ${this.SIZE} ${this.SIZE}`);
    this.buildWheel();
    this.discoRef.nativeElement.classList.add('idle');

    // transition end handler
    const onEnd = () => { if (!this.girando) return; this.finalizar(); };
    this.renderer.listen(svg, 'transitionend', onEnd);
    this.transitionEndUnlisten = () => this.renderer.listen(svg, 'transitionend', () => {})();

    // Start idle pulse schedule
    this.scheduleIdlePulse(2000);
  }

  ngOnDestroy(): void {
    if (this.transitionEndUnlisten) { try { this.transitionEndUnlisten(); } catch {} }
    if (this.messageUnlisten) { try { this.messageUnlisten(); } catch {} }
    this.stopIdlePulse();
  }

  onGirar(): void {
    this.stopIdlePulse();
    const k = this.rndInt(this.N);
    const turns = 5 + this.rndInt(4);
    const duration = 5200 + this.rndInt(1400);
    try { parent.postMessage({ type: 'roletaSpinStarted', index: k, turns, duration }, '*'); } catch {}
    this.girarParaIndiceComParams(k, turns, duration);
  }

  private create(tag: string, attrs: Record<string,string|number>): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, String(attrs[k]));
    return el;
  }

  private buildWheel(): void {
    const svg = this.wheelRef.nativeElement;
    svg.innerHTML = '';
    const group = this.create('g', { id: 'wheelGroup', transform:`translate(${this.CX},${this.CY})` });
    const rOuter = this.CX - 20;
    for (let i = 0; i < this.N; i++) {
      const a1 = (360/this.N)*i - 90 + this.offset;
      const a2 = (360/this.N)*(i+1) - 90 + this.offset;
      const x1 = rOuter * Math.cos(a1 * Math.PI/180);
      const y1 = rOuter * Math.sin(a1 * Math.PI/180);
      const x2 = rOuter * Math.cos(a2 * Math.PI/180);
      const y2 = rOuter * Math.sin(a2 * Math.PI/180);
      const pathD = `M 0 0 L ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} Z`;
      const sector = this.create('path', { d: pathD, fill: this.colors[i % this.colors.length], stroke:'#311235', 'stroke-width': '8' as any });
      group.appendChild(sector);

      const midA = (a1 + a2)/2;
      const imgSize = 56;
      const imgRadius = rOuter - imgSize/2 - 12;
      const ix = imgRadius * Math.cos(midA * Math.PI/180);
      const iy = imgRadius * Math.sin(midA * Math.PI/180);
      const imgEl = this.create('image', { x: String(ix - imgSize/2), y: String(iy - imgSize/2), width: String(imgSize), height: String(imgSize) });
      (imgEl as any).setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.images[i % this.images.length]);
      imgEl.setAttribute('preserveAspectRatio','xMidYMid slice');
      group.appendChild(imgEl);
    }
    const ring = this.create('circle', { cx:'0', cy:'0', r: String((this.CX - 20) + 8), fill:'none', stroke:'rgba(0,0,0,0.25)', 'stroke-width':'4' });
    group.appendChild(ring);
    svg.appendChild(group);
  }

  private stopIdlePulse(): void {
    try { if (this.idlePulseTimeout) { clearTimeout(this.idlePulseTimeout); this.idlePulseTimeout = null; } } catch {}
    try { this.discoRef.nativeElement.classList.remove('pulse3'); } catch {}
  }

  private triggerIdlePulse(): void {
    if (this.girando) return;
    try {
      const disco = this.discoRef.nativeElement;
      disco.classList.remove('idle');
      disco.classList.add('pulse3');
      const onEnd = () => {
        disco.classList.remove('pulse3');
        if (!this.girando) disco.classList.add('idle');
        disco.removeEventListener('animationend', onEnd);
        if (!this.girando) this.scheduleIdlePulse(2800);
      };
      disco.addEventListener('animationend', onEnd);
    } catch {}
  }

  private scheduleIdlePulse(delayMs = 2000): void {
    this.stopIdlePulse();
    this.idlePulseTimeout = setTimeout(() => this.triggerIdlePulse(), delayMs);
  }

  private rndInt(max: number): number { const a = new Uint32Array(1); window.crypto.getRandomValues(a); return a[0] % max; }
  private modulo(a: number, n: number): number { return ((a % n) + n) % n; }
  private indiceParaCentro(k: number): number { return this.offset + k * (360 / this.N); }

  private girarParaIndice(k: number): void {
    try { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; } catch {}
    this.stopIdlePulse();
    const voltas = 5 + this.rndInt(4);
    const centro = this.indiceParaCentro(k);
    const alvo = voltas*360 + this.modulo(-centro,360);
    const dur = 5200 + this.rndInt(1400);
    this.discoRef.nativeElement.classList.remove('idle');
    const svg = this.wheelRef.nativeElement as any;
    svg.style.transition = `transform ${dur}ms cubic-bezier(.17,.89,.32,1.49)`;
    svg.style.transitionDuration = dur + 'ms';
    this.alvoGraus += alvo;
    this.girando = true; this.girarBtnRef.nativeElement.disabled = true;
    requestAnimationFrame(() => { (this.wheelRef.nativeElement as any).style.transform = `rotate(${this.alvoGraus}deg)`; });
  }

  private girarParaIndiceComParams(kParam: number, tParam: number, dParam: number): void {
    try { document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; } catch {}
    this.stopIdlePulse();
    const voltas = tParam;
    const centro = this.indiceParaCentro(kParam);
    const alvo = voltas*360 + this.modulo(-centro,360);
    const dur = dParam;
    this.discoRef.nativeElement.classList.remove('idle');
    const svg = this.wheelRef.nativeElement as any;
    svg.style.transition = `transform ${dur}ms cubic-bezier(.17,.89,.32,1.49)`;
    svg.style.transitionDuration = dur + 'ms';
    this.alvoGraus += alvo;
    this.girando = true; this.girarBtnRef.nativeElement.disabled = true;
    requestAnimationFrame(() => { (this.wheelRef.nativeElement as any).style.transform = `rotate(${this.alvoGraus}deg)`; });
  }

  private finalizar(): void {
    this.girando = false; this.girarBtnRef.nativeElement.disabled = false;
    try { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; } catch {}
    const final = this.modulo(this.alvoGraus, 360);
    const idx = Math.round(((-final - this.offset) / (360 / this.N)));
    const k = this.modulo(idx, this.N);
    this.showModalForIndex(k);
  }

  private showModalForIndex(k: number): void {
    const imgFile = this.images[k % this.images.length];
    this.modalImageSrc = imgFile;
    this.modalLabelText = this.labels[k] || `Resultado ${k}`;
    this.showingModal = true;
    this.launchConfetti(3500);
    try { parent.postMessage({ type: 'roletaResult', category: this.labels[k] || `Resultado ${k}`, points: this.pointsMap[k] || 1, index: k }, '*'); } catch {}
  }

  private hideModal(): void {
    this.showingModal = false;
  }

  private launchConfetti(duration = 3000): void {
    const colors = ['#ffd23a','#ff6b6b','#6bffb3','#6b9bff','#ff9f43'];
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed'; canvas.style.left='0'; canvas.style.top='0'; canvas.style.width='100%'; canvas.style.height='100%'; canvas.style.pointerEvents='none'; canvas.style.zIndex = '9998';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const particles: any[] = [];
    const count = 120;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random()*canvas.width,
        y: -20 - Math.random()*canvas.height*0.2,
        vx: (Math.random()-0.5)*6,
        vy: 2 + Math.random()*6,
        size: 6 + Math.random()*8,
        rot: Math.random()*360,
        color: colors[Math.floor(Math.random()*colors.length)],
      });
    }
    const start = performance.now();
    let raf = 0;
    const frame = (t: number) => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      for (const p of particles) {
        p.vy += 0.12; p.x += p.vx; p.y += p.vy; p.rot += p.vx*2;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        ctx.restore();
      }
      if (t - start < duration) { raf = requestAnimationFrame(frame); }
      else { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); canvas.remove(); }
    };
    raf = requestAnimationFrame(frame);
  }
}
