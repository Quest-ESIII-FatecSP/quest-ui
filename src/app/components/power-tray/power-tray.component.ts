import { Component, EventEmitter, Input, Output } from '@angular/core';

export type PowerType =
  'freeze' | 'fourclicks' | 'jumpscare' | 'xmask' | 'steal';

export interface PlayerPowers {
  freeze: number;
  fourclicks: number;
  jumpscare: number;
  xmask: number;
}

@Component({
  selector: 'app-power-tray',
  templateUrl: './power-tray.component.html',
  styleUrl: './power-tray.component.scss'
})
export class PowerTrayComponent {

  readonly powerList: (keyof PlayerPowers)[] = [
    'freeze',
    'fourclicks',
    'jumpscare',
    'xmask'
  ];

  @Input() disabled = false;
  @Input() isMyTurn = false;

  @Input() leftPowers: PlayerPowers = {
    freeze: 1,
    fourclicks: 1,
    jumpscare: 1,
    xmask: 1
  };

  @Input() rightPowers: PlayerPowers = {
    freeze: 1,
    fourclicks: 1,
    jumpscare: 1,
    xmask: 1
  };

  @Output() powerUsed = new EventEmitter<PowerType>();

  readonly icons = {
    freeze: 'assets/img/congelar.png',
    fourclicks: 'assets/img/4cliques.png',
    jumpscare: 'assets/img/jumpscare.png',
    xmask: 'assets/img/x.png',
    steal: 'assets/img/roubarpergunta.jpeg'
  };

  use(power: keyof PlayerPowers, side: 'left' | 'right') {
    if (this.disabled) return;

    if ((side === 'left' ? this.leftPowers[power] : this.rightPowers[power]) <= 0)
      return;

    if (this.isMyTurn) return;

    this.powerUsed.emit(power);
  }
}
