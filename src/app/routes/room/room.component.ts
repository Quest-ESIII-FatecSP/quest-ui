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
export class RoomComponent {
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
    this.closeThemeModal();

    if (this.selectedSector) {
      const categoria = this.selectedSector.label;
      const pontos = 1; // ou o valor que quiser usar
      // this.showCardSelection(categoria, pontos);
    }
  }


  constructor(private roomService: RoomService) {}


}
