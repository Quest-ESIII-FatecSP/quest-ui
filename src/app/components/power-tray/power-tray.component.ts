import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TipoPoder } from '../../enum/TipoPoder.enum';


@Component({
  selector: 'app-power-tray',
  templateUrl: './power-tray.component.html',
  styleUrl: './power-tray.component.scss'
})
export class PowerTrayComponent {

  readonly powerList: TipoPoder[] = [
    TipoPoder.FREEZE_QUESTIONS,
    TipoPoder.MOUSE_ESCAPE,
    TipoPoder.JUMP_SCARE,
    TipoPoder.VOWEL_X
  ];

  @Input() disabled = false;
  @Input() isMyTurn = false;

  @Input() leftPowers: Partial<Record<TipoPoder, number>> = {
    [TipoPoder.FREEZE_QUESTIONS]: 0,
    [TipoPoder.MOUSE_ESCAPE]: 0,
    [TipoPoder.JUMP_SCARE]: 0,
    [TipoPoder.VOWEL_X]: 0,
    [TipoPoder.STEAL_QUESTION]: 0
  };

  @Input() rightPowers: Partial<Record<TipoPoder, number>> = {
    [TipoPoder.FREEZE_QUESTIONS]: 0,
    [TipoPoder.MOUSE_ESCAPE]: 0,
    [TipoPoder.JUMP_SCARE]: 0,
    [TipoPoder.VOWEL_X]: 0,
    [TipoPoder.STEAL_QUESTION]: 0
  };

  @Output() powerUsed = new EventEmitter<TipoPoder>();

  readonly icons: Record<TipoPoder, string> = {
    [TipoPoder.FREEZE_QUESTIONS]: 'assets/img/congelar.png',
    [TipoPoder.MOUSE_ESCAPE]: 'assets/img/4cliques.png',
    [TipoPoder.JUMP_SCARE]: 'assets/img/jumpscare.png',
    [TipoPoder.VOWEL_X]: 'assets/img/x.png',
    [TipoPoder.STEAL_QUESTION]: 'assets/img/roubarpergunta.jpeg'
  };

  use(power: TipoPoder) {
    if (this.disabled || this.isMyTurn) return;

    const count = this.leftPowers[power] ?? 0;
    if (count <= 0) return;

    this.powerUsed.emit(power);
  }
}
