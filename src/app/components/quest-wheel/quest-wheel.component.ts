import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

export interface WheelSector {
  id?: string | number;
  label: string;
  iconUrl?: string;
  color?: string;
}

@Component({
  selector: 'app-quest-wheel',
  templateUrl: './quest-wheel.component.html',
  styleUrl: './quest-wheel.component.scss'
})
export class QuestWheelComponent {
  @Input() sectors: WheelSector[] = [
    { id: 'mundo', label: 'Mundo', color: '#ffd23a', iconUrl: '../../../assets/img/M.png' },
    { id: 'esportes', label: 'Esportes e Lazer', color: '#18a558', iconUrl: '../../../assets/img/EL.png' },
    { id: 'ciencias', label: 'Ciências', color: '#0f7bff', iconUrl: '../../../assets/img/CT.png' },
    { id: 'sociedade', label: 'Sociedade', color: '#8b2be2', iconUrl: '../../../assets/img/S.png' },
    { id: 'arte', label: 'Arte e Entretenimento', color: '#ff4d4d', iconUrl: '../../../assets/img/E.png' },
    { id: 'variedades', label: 'Variedades', color: '#a65b2b', iconUrl: '../../../assets/img/V.png' }
  ];

  @Input() locked = false;
  @Input() showControl = true; // (not used deeply, button respects locked)
  @Input() spinDuration = 5200; // default ms (used as base when forcing spinToIndex without duration)
  @Output() spinStart = new EventEmitter<void>();
  @Output() spinEnd = new EventEmitter<{ index: number; sector: WheelSector }>();

  @ViewChild('svgEl', { static: true }) svgRef!: ElementRef<SVGElement>;
  @ViewChild('discoEl', { static: true }) discoRef!: ElementRef<HTMLDivElement>;
  @ViewChild('girarBtn', { static: true }) girarBtnRef!: ElementRef<HTMLButtonElement>;

  spinning = false;

  // internal rotation accumulator (matches seu arquivo original - alvoGraus)
  private alvoGraus = 0;
  private girando = false;
  private transitionEndHandler = this.onSvgTransitionEnd.bind(this);

  // configuration to match original behavior
  private readonly baseTurnsMin = 5;
  private readonly turnRandomExtraMax = 4;
  private readonly size = 420;
  private readonly offset = 0; // mantém como seu original (pode ajustar se necessário)

  // helper RNG: usa crypto quando disponível
  private rndInt(max: number) {
    try {
      const arr = new Uint32Array(1);
      (window.crypto || (window as any).msCrypto).getRandomValues(arr);
      return arr[0] % max;
    } catch {
      return Math.floor(Math.random() * max);
    }
  }

  ngAfterViewInit(): void {
    // constrói a roda no SVG
    this.buildWheel();

    // binding do transitionend para detecção de fim de rotação
    const svgEl = this.svgRef.nativeElement;
    svgEl.addEventListener('transitionend', this.transitionEndHandler);
  }

  ngOnDestroy(): void {
    try { this.svgRef.nativeElement.removeEventListener('transitionend', this.transitionEndHandler); } catch { }
  }

  // ---------- SVG / wheel building (cópia fiel do seu algoritmo) ----------
  private buildWheel() {
    const svg = this.svgRef.nativeElement;
    const N = Math.max(1, this.sectors.length);
    const SIZE = this.size;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const rOuter = CX - 20;

    // limpa
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // cria grupo central (com translate para centro)
    const ns = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('id', 'wheelGroup');
    group.setAttribute('transform', `translate(${CX},${CY})`);

    for (let i = 0; i < N; i++) {
      const a1 = (360 / N) * i - 90 + this.offset;
      const a2 = (360 / N) * (i + 1) - 90 + this.offset;

      const x1 = rOuter * Math.cos(a1 * Math.PI / 180);
      const y1 = rOuter * Math.sin(a1 * Math.PI / 180);
      const x2 = rOuter * Math.cos(a2 * Math.PI / 180);
      const y2 = rOuter * Math.sin(a2 * Math.PI / 180);

      const pathD = `M 0 0 L ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} Z`;
      const path = document.createElementNS(ns, 'path');

      const color = this.sectors[i]?.color ?? this.pickFallbackColor(i);

      path.setAttribute('d', pathD);
      path.setAttribute('fill', color);
      path.setAttribute('stroke', '#311235');
      path.setAttribute('stroke-width', '8');

      group.appendChild(path);

      // --- ÍCONE ---
      const midA = (a1 + a2) / 2;
      const imgSize = 72;
      const imgRadius = rOuter - imgSize / 2 - 12;

      const ix = imgRadius * Math.cos(midA * Math.PI / 180);
      const iy = imgRadius * Math.sin(midA * Math.PI / 180);

      const imgEl = document.createElementNS(ns, 'image');
      imgEl.setAttribute('x', String(ix - imgSize / 2));
      imgEl.setAttribute('y', String(iy - imgSize / 2));
      imgEl.setAttribute('width', String(imgSize));
      imgEl.setAttribute('height', String(imgSize));
      imgEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');

      // caminho real do asset Angular
      const file = this.sectors[i]?.iconUrl ?? 'placeholder.png';
      imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${file}`);

      group.appendChild(imgEl);
    }


    // ring
    const ring = document.createElementNS(ns, 'circle');
    ring.setAttribute('cx', '0');
    ring.setAttribute('cy', '0');
    ring.setAttribute('r', String(rOuter + 8));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', 'rgba(0,0,0,0.25)');
    ring.setAttribute('stroke-width', '4');
    group.appendChild(ring);

    svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    svg.appendChild(group);
  }

  private pickFallbackColor(i: number) {
    const defaultColors = ['#18a558', '#8b4513', '#0f7bff', '#8b2be2', '#ffd23a', '#ff4d4d'];
    return defaultColors[i % defaultColors.length];
  }

  private shortLabel(label: string) {
    if (!label) return '';
    const parts = label.split(' ');
    if (parts.length === 1) return label.length <= 4 ? label : label.slice(0, 4);
    return parts[0].slice(0, 4);
  }

  // ---------- Spin control (mesma lógica do HTML original) ----------
  onGirarClick() {
    // dispara um spin aleatório localmente; em integração, o pai pode chamar spinToIndex em vez disso
    // desabilita botão automaticamente via binding
    this.stopIdlePulseSafely();
    const k = this.rndInt(this.sectors.length);
    const turns = this.baseTurnsMin + this.rndInt(this.turnRandomExtraMax + 1);
    const duration = 5200 + this.rndInt(1400);
    // emitir que o spin começou (pai pode interceptar)
    this.spinStart.emit();
    this.spinToIndex(k, turns, duration);
  }

  /**
   * Força a roleta para o índice especificado
   * @param index índice do setor (0..N-1)
   * @param turns número de voltas completas
   * @param duration duração em ms (se não passar, usa spinDuration)
   */
  spinToIndex(index: number, turns?: number, duration?: number) {
    if (this.locked || this.spinning) return;
    const N = Math.max(1, this.sectors.length);
    if (!Number.isFinite(index) || index < 0 || index >= N) {
      console.warn('QuestWheel: índice inválido', index);
      return;
    }
    this.spinning = true;
    this.girando = true;
    (this.girarBtnRef.nativeElement).disabled = true;

    const voltas = (turns ?? (this.baseTurnsMin + this.rndInt(this.turnRandomExtraMax + 1)));
    const centro = this.indiceParaCentro(index);
    const alvo = voltas * 360 + this.modulo(-centro, 360);
    const dur = (duration ?? this.spinDuration);

    const svgEl = this.svgRef.nativeElement as SVGElement;
    // remove transition (will be set) to allow setting duration
    svgEl.style.transition = `transform ${dur}ms cubic-bezier(.17,.89,.32,1.49)`;
    this.alvoGraus += alvo;
    // gatilho visual
    requestAnimationFrame(() => {
      svgEl.style.transform = `rotate(${this.alvoGraus}deg)`;
    });
  }

  spinRandom() {
    if (this.locked || this.spinning) return;
    const k = this.rndInt(this.sectors.length);
    this.spinToIndex(k);
  }

  // calcula centro do setor em graus (mesma fórmula)
  private indiceParaCentro(k: number) {
    const N = Math.max(1, this.sectors.length);
    return this.offset + k * (360 / N);
  }

  // normal modulo
  private modulo(a: number, n: number) { return ((a % n) + n) % n; }

  // finalização quando SVG termina a transição
  private onSvgTransitionEnd(evt: TransitionEvent) {
    // garante que seja a transformação de rotate que finalizou
    if (!this.girando) return;
    // finalize
    this.finalizar();
  }

  private finalizar() {
    this.girando = false;
    this.spinning = false;
    try { (this.girarBtnRef.nativeElement).disabled = false; } catch { }
    const final = this.modulo(this.alvoGraus, 360);
    // cálculo idêntico ao HTML:
    // idx = Math.round(((-final - offset)/(360/N)));
    const N = Math.max(1, this.sectors.length);
    const raw = ((-final - this.offset) / (360 / N));
    const idx = Math.round(raw);
    const k = this.modulo(idx, N);
    // emite spinEnd com índice e setor
    const sector = this.sectors[k];
    this.spinEnd.emit({ index: k, sector });
  }

  private stopIdlePulseSafely() {
    // stub - nada para fazer na opção B
  }

  // API pública para reset (sem animação)
  resetRotationImmediate() {
    if (this.spinning) return;
    const svgEl = this.svgRef.nativeElement;
    svgEl.style.transition = 'none';
    svgEl.style.transform = 'rotate(0deg)';
    // force reflow
    void svgEl.getBoundingClientRect();
    svgEl.style.transition = '';
    this.alvoGraus = 0;
    this.spinning = false;
    try { (this.girarBtnRef.nativeElement).disabled = false; } catch { }
  }
}
