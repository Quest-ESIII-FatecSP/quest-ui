import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';

export type Side = 'left' | 'right';

export interface Card {
  id: string;
  value: number;
  used: boolean;
  disabled: boolean;
  picked: boolean;
}

@Component({
  selector: 'app-card-selection',
  templateUrl: './card-selection.component.html',
  styleUrl: './card-selection.component.scss'
})
export class CardSelectionComponent implements OnChanges {

  leftCards: Card[] = [
    { id: 'L1', value: 1, used: false, disabled: false, picked: false },
    { id: 'L2', value: 2, used: false, disabled: false, picked: false },
    { id: 'L3', value: 3, used: false, disabled: false, picked: false },
    { id: 'L4', value: 4, used: false, disabled: false, picked: false },
    { id: 'L5', value: 5, used: false, disabled: false, picked: false }
  ];

  rightCards: Card[] = [
    { id: 'R1', value: 1, used: false, disabled: false, picked: false },
    { id: 'R2', value: 2, used: false, disabled: false, picked: false },
    { id: 'R3', value: 3, used: false, disabled: false, picked: false },
    { id: 'R4', value: 4, used: false, disabled: false, picked: false },
    { id: 'R5', value: 5, used: false, disabled: false, picked: false }
  ];

  @Input() availableCards: number[] = [];
  @Input() opponentCards: number[] = [];
  @Input() choosenCard: number | null = null;
  @Input() disabled = false;
  @Input() isMyTurn = false;
  @Input() leftTitle = 'Suas Cartas';
  @Input() rightTitle = 'Cartas do Oponente';

  @Output() pickRequested = new EventEmitter<number>();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes['choosenCard'] && this.choosenCard !== null) {
    //   this.forcePick(this.choosenCard);
    // } else {
      this.updateRight();
      this.updateLeft();
    // }
  }

  private updateLeft() {
    const avail = this.availableCards ?? [];

    this.leftCards = this.leftCards.map(c => ({
      ...c,
      used: !avail.includes(c.value),
      disabled: this.disabled || !this.isMyTurn || !avail.includes(c.value)
    }));
  }

  private updateRight() {
    const opp = this.opponentCards ?? [];

    this.rightCards = this.rightCards.map(c => ({
      ...c,
      used: !opp.includes(c.value),
      disabled: true
    }));
  }

  public pick(cardNumber: number) {
    const card = this.leftCards.find(c => c.value === cardNumber)!;

    if (card.used || card.disabled || !this.isMyTurn) return;

    this.leftCards = this.leftCards.map(c => ({
      ...c,
      picked: c.id === card.id,
      disabled: true  // desabilita TODAS após o pick
    }));

    this.pickRequested.emit(card.value);
  }

  // public forcePick(value: number | null) {
  //   if (!value || !this.isMyTurn) return;

  //   console.log("Forcing pick of card:", value);

  //   this.leftCards = this.leftCards.map(c => ({
  //     ...c,
  //     picked: c.value === value,
  //     disabled: true
  //   }));

  //   this.cdr.detectChanges();
  // }

  get leftColA() { return this.leftCards.slice(0, 3); }
  get leftColB() { return this.leftCards.slice(3); }
  get rightColA() { return this.rightCards.slice(0, 2); }
  get rightColB() { return this.rightCards.slice(2); }
}
