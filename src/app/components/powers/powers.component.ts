import { Component, Input, Output, EventEmitter } from '@angular/core';

export type PowerType = 'FREEZE' | 'RUNAWAY' | 'JUMPSCARE' | 'XMASK' | 'STEAL';

@Component({
  selector: 'app-power-tray',
  templateUrl: './powers.component.html',
  styleUrls: ['./powers.component.scss']
})
export class PowersComponent {
  @Input() localPlayerId: string = "";      
  @Input() currentTurnPlayerId: string = ""; 
  @Input() usedPowers: string[] = [];      

  @Output() onUsePower = new EventEmitter<{type: PowerType, fromPlayer: string}>();
  canUsePower(powerOwnerId: string, powerType: string): boolean {
    if (powerOwnerId !== this.localPlayerId) return false;

    if (this.currentTurnPlayerId === this.localPlayerId) return false;
    const powerKey = `p${powerOwnerId}_${powerType}`;
    if (this.usedPowers.includes(powerKey)) return false;

    return true;
  }

  canSteal(): boolean {
    if (this.currentTurnPlayerId === this.localPlayerId) return false;
    const powerKey = `p${this.localPlayerId}_STEAL`;
    if (this.usedPowers.includes(powerKey)) return false;
    return true;
  }

  activate(type: PowerType) {
    this.onUsePower.emit({ type, fromPlayer: this.localPlayerId });
  }
}