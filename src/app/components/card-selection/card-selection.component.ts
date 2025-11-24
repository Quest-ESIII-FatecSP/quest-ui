import { Component, EventEmitter, Input, Output } from '@angular/core';

export type Side = 'left' | 'right';

export interface Card {
  id: string;       // ID estável usado em mensagens STOMP
  value: number;    // valor (1..5)
  used?: boolean;   // se já foi usada
  meta?: any;       // campo livre para o pai (ex: ownerId, icon, etc)
}

@Component({
  selector: 'app-card-selection',
  templateUrl: './card-selection.component.html',
  styleUrl: './card-selection.component.scss'
})
export class CardSelectionComponent {
  // ---------- Inputs ----------
  /** leftCards/rightCards should each be arrays of exactly 5 Card objects (id stable) */
  @Input() leftCards: Card[] = [
    { id: 'l1', value: 1 },
    { id: 'l2', value: 2 },
    { id: 'l3', value: 3 },
    { id: 'l4', value: 4 },
    { id: 'l5', value: 5 }
  ];
  @Input() rightCards: Card[] = [
    { id: 'r1', value: 1 },
    { id: 'r2', value: 2 },
    { id: 'r3', value: 3 },
    { id: 'r4', value: 4 },
    { id: 'r5', value: 5 }
  ];

  /** Which side is allowed to pick now */
  @Input() activeSide: Side = 'left';

  /** Global disable */
  @Input() disabled = false;
  @Input() availableCards: number[] = [];

  /** Titles shown above panels */
  @Input() leftTitle = 'Suas Cartas';
  @Input() rightTitle = 'Cartas do Oponente';


  /** Optional: if set, component will auto-clear internal pick state after that ms */
  @Input() autoClearMs?: number;

  // ---------- Outputs ----------
  /** Emitted when the local user requests a pick (parent should send to backend) */
  @Output() pickRequested = new EventEmitter<{ side: Side; cardId: string; value: number }>();

  /** Emitted when selection is cancelled or reset (optional) */
  @Output() selectionCancelled = new EventEmitter<void>();

  // internal pick state (visual)
  pickedSide: Side | null = null;
  pickedCardId: string | null = null;

  private autoClearTimer: any = null;

  // ------------ Layout helpers -------------
  // left: colA -> first 3, colB -> last 2
  get leftColA(): Card[] { return (this.leftCards || []).slice(0, 3); }
  get leftColB(): Card[] { return (this.leftCards || []).slice(3, 5); }

  // right: colA -> first 3, colB -> last 2
  get rightColA() { return this.rightCards.slice(0, 2); }
  get rightColB() { return this.rightCards.slice(2, 5); }



  // ------------- API / Handlers -------------
  isDisabled(side: Side, card: Card): boolean {
    if (this.disabled) return true;
    if (card.used) return true;
    // if already picked, only the picked card remains visually enabled (others disabled)
    if (this.pickedCardId !== null) {
      return !(this.pickedSide === side && this.pickedCardId === card.id);
    }
    // only allow picks from active side
    return this.activeSide !== side;
  }

  isPicked(side: Side, card: Card) {
    return this.pickedCardId !== null && this.pickedSide === side && this.pickedCardId === card?.id;
      // || !this.availableCards.includes(card?.value));
  }

  pick(side: Side, card: Card) {
    if (this.isDisabled(side, card)) return;
    this.pickedSide = side;
    this.pickedCardId = card.id;

    // emit request to parent -> parent will call backend; parent should confirm back
    this.pickRequested.emit({ side, cardId: card.id, value: card.value });

  }

  // Parent can call this to visually force the pick (e.g. when backend broadcasts confirmation)
  forcePick(side: Side, cardId: string) {
    // ensure card exists
    const sideArr = side === 'left' ? this.leftCards : this.rightCards;
    const exists = (sideArr || []).some(c => c.id === cardId);
    if (!exists) return;
    this.pickedSide = side;
    this.pickedCardId = cardId;
    this.clearAutoTimer();
  }

  // reset internal visual selection
  reset() {
    this.pickedSide = null;
    this.pickedCardId = null;
    this.clearAutoTimer();
  }

  cancel() {
    this.reset();
    this.selectionCancelled.emit();
  }

  private clearAutoTimer() {
    if (this.autoClearTimer) { clearTimeout(this.autoClearTimer); this.autoClearTimer = null; }
  }

  ngOnDestroy(): void {
    this.clearAutoTimer();
  }

  /** Marca uma carta como usada (visual) */
  markCardUsed(side: 'left' | 'right', cardId: string) {
    const arr = side === 'left' ? this.leftCards : this.rightCards;
    const idx = arr.findIndex(c => c.id === cardId);
    if (idx === -1) return;
    arr[idx] = { ...arr[idx], used: true };

    // se a carta marcada era a pick visual atual, limpe a seleção
    if (this.pickedCardId === cardId && this.pickedSide === side) {
      this.reset();
    }
  }

  /** Substitui os arrays de cartas (quando o pai recebe estado do servidor) */
  setCards(left: Card[], right: Card[]) {
    this.leftCards = Array.isArray(left) ? left.slice() : [];
    this.rightCards = Array.isArray(right) ? right.slice() : [];
    // opcional: limpar pick visual ao re-sincronizar
    this.reset();
  }
}
