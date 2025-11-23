import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, SimpleChanges } from '@angular/core';
import {THEMES} from "@shared/constants/theme.constants";
import {WheelSector} from "../../model/ITheme";

@Component({
  selector: 'app-quest-wheel',
  templateUrl: './quest-wheel.component.html',
  styleUrl: './quest-wheel.component.scss'
})
export class QuestWheelComponent {

  sectors: WheelSector[] = THEMES

  @Input() targetIndex: boolean = true;
  @Input() locked = false;
  @Input() showControl = true;
  @Input() spinDuration = 5000;
  @Output() spinStart = new EventEmitter<void>();
  @Output() spinEnd = new EventEmitter<{ index: number; sector: WheelSector }>();

  @ViewChild('svgEl', { static: true }) svgRef!: ElementRef<SVGElement>;
  @ViewChild('discoEl', { static: true }) discoRef!: ElementRef<HTMLDivElement>;

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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['targetIndex']) {
      const newIndex = changes['targetIndex'].currentValue;

      const sectionIndex = this.sectors.findIndex(s => s.id === newIndex);

      // if (!this.locked && !this.spinning && sectionIndex !== -1) {
      //   this.spinToIndex(sectionIndex);
      // }

      if (!this.locked && !this.spinning) {
        if (sectionIndex !== -1) {
          this.spinToIndex(sectionIndex);
        } else {
          this.spinRandom(); // fallback
        }
      }
    }
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

      const file = this.sectors[i]?.iconUrl ?? 'placeholder.png';
      imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `${file}`);

      group.appendChild(imgEl);
    }


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

  onGirarClick() {
    // dispara um spin aleatório localmente; em integração, o pai pode chamar spinToIndex em vez disso
    // desabilita botão automaticamente via binding
    const k = this.rndInt(this.sectors.length);
    const turns = this.baseTurnsMin + this.rndInt(this.turnRandomExtraMax + 1);
    const duration = 5200 + this.rndInt(1400);

    this.spinStart.emit();
    this.spinToIndex(k, turns, duration);
  }

  spinToIndex(index: number, turns?: number, duration?: number) {
    if (this.locked || this.spinning) return;
    const N = Math.max(1, this.sectors.length);
    if (!Number.isFinite(index) || index < 0 || index >= N) {
      console.warn('QuestWheel: índice inválido', index);
      return;
    }
    this.spinning = true;
    this.girando = true;

    const voltas = (turns ?? (this.baseTurnsMin + this.rndInt(this.turnRandomExtraMax + 1)));
    const centro = this.indiceParaCentro(index);
    const alvo = voltas * 360 + this.modulo(-centro, 360);
    const dur = (duration ?? this.spinDuration);

    const svgEl = this.svgRef.nativeElement as SVGElement;
    svgEl.style.transition = `transform ${dur}ms cubic-bezier(.17,.89,.32,1.49)`;
    this.alvoGraus += alvo;

    requestAnimationFrame(() => {
      svgEl.style.transform = `rotate(${this.alvoGraus}deg)`;
    });
  }

  spinRandom() {
    if (this.locked || this.spinning) return;
    const k = this.rndInt(this.sectors.length);
    this.spinToIndex(k);
  }

  private indiceParaCentro(k: number) {
    const N = Math.max(1, this.sectors.length);
    return this.offset + k * (360 / N);
  }

  private modulo(a: number, n: number) { return ((a % n) + n) % n; }

  private onSvgTransitionEnd(evt: TransitionEvent) {
    if (!this.girando) return;

    this.finalizar();
  }

  private finalizar() {
    this.girando = false;
    this.spinning = false;
    const final = this.modulo(this.alvoGraus, 360);

    const N = Math.max(1, this.sectors.length);
    const raw = ((-final - this.offset) / (360 / N));
    const idx = Math.round(raw);
    const k = this.modulo(idx, N);

    const sector = this.sectors[k];
    this.spinEnd.emit({ index: k, sector });
  }

  resetRotationImmediate() {
    if (this.spinning) return;
    const svgEl = this.svgRef.nativeElement;
    svgEl.style.transition = 'none';
    svgEl.style.transform = 'rotate(0deg)';

    void svgEl.getBoundingClientRect();
    svgEl.style.transition = '';
    this.alvoGraus = 0;
    this.spinning = false;
  }
}
