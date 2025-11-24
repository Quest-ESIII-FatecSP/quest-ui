import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';

export type Side = 'left' | 'right';

export interface Card {
  id: string;
  value: number;
  used?: boolean;
  disabled?: boolean;
  picked?: boolean;
}

@Component({
  selector: 'app-card-selection',
  templateUrl: './card-selection.component.html',
  styleUrl: './card-selection.component.scss'
})
export class CardSelectionComponent implements OnChanges {

  leftCards: Card[] = [{ id: 'L1', value: 1 }, { id: 'L2', value: 2 }, { id: 'L3', value: 3 }, { id: 'L4', value: 4 }, { id: 'L5', value: 5 }];
  rightCards: Card[] = [{ id: 'R1', value: 1 }, { id: 'R2', value: 2 }, { id: 'R3', value: 3 }, { id: 'R4', value: 4 }, { id: 'R5', value: 5 }
  ];

  @Input() availableCards: number[] = [];
  @Input() opponentCards: number[] = [];

  @Input() autoPickValue: number | null = null;

  @Input() disabled = false;
  @Input() isMyTurn = false;

  @Input() leftTitle = 'Suas Cartas';
  @Input() rightTitle = 'Cartas do Oponente';

  @Output() pickRequested = new EventEmitter<number>();

  ngOnChanges(changes: SimpleChanges): void {
    this.updateLeft();
    this.updateRight();

    if (changes['autoPickValue'] && this.autoPickValue !== null) {
      this.forcePick(this.autoPickValue);
    }
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

  pick(side: Side, card: Card) {
    if (side !== 'left') return;
    if (card.used || card.disabled || !this.isMyTurn) return;

    this.leftCards = this.leftCards.map(c => ({
      ...c,
      picked: c.id === card.id,
      disabled: c.id !== card.id
    }));

    this.availableCards = this.availableCards?.filter(v => v !== card.value) || [];

    this.pickRequested.emit(card.value);
  }

  public forcePick(value: number) {
    console.log("Forcing pick of value:", value);
    if(!this.autoPickValue) return;

    // Só afeta o lado esquerdo
    this.leftCards = this.leftCards.map(c => ({
      ...c,
      picked: c.value === value,
      disabled: c.value !== value
    }));

  }


  get leftColA() { return this.leftCards.slice(0, 3); }
  get leftColB() { return this.leftCards.slice(3); }

  get rightColA() { return this.rightCards.slice(0, 2); }
  get rightColB() { return this.rightCards.slice(2); }
}
