import { Component, ViewChild } from '@angular/core';
import { QuestWheelComponent, WheelSector } from '../../components/quest-wheel/quest-wheel.component';
import { RoomService } from "./room.service";
import { Card, CardSelectionComponent, Side } from '../../components/card-selection/card-selection.component';

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
  constructor(private roomService: RoomService) { }

  // !!! LOGICA DA ROLETA e outras coisas ai !!! //

  @ViewChild(QuestWheelComponent) wheel?: QuestWheelComponent;

  roletaTravada: boolean = false;

  roletaComecouSpin(event: any) {
    this.roletaTravada = true;
  }

  temaSelecionado = "EL";

  themeModalOpen = false;
  categoriaSelecionada: WheelSector | null = null;
  private autoCloseTimer: any = null;

  useFreezeQuestions() { this.roomService.usePower('FREEZE_QUESTIONS', 'id') }
  useStealQuestion() { this.roomService.usePower('STEAL_QUESTION', 'id') }
  useMouseEscape() { this.roomService.usePower('MOUSE_ESCAPE', 'id') }
  useJumpScare() { this.roomService.usePower('JUMP_SCARE', 'id') }
  useVowelX() { this.roomService.usePower('VOWEL_X', 'id') }

  // opcional: tempo para fechar automaticamente (ms)
  autoCloseMs = 500;

  onSpinStart() {
    // bloquear UI se necessário, mostrar "girando..."
    console.log('spin started');
    // ex: this.isSpinning = true;
  }

  onSpinEnd(result: { index: number; sector: WheelSector }) {
    console.log('spin ended', result);
    this.categoriaSelecionada = result.sector;
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

    if (this.categoriaSelecionada) {
      // const categoria = this.categoriaSelecionada.label;
      // const pontos = 1; // ou o valor que quiser usar
      // this.showCardSelection(categoria, pontos);
      this.startCardSelectionFor(this.categoriaSelecionada);
    }
  }

  // !!! LOGICA DE CARD SELECTION !!! //
  @ViewChild('cardSelectionRef') cardSelectionRef?: CardSelectionComponent;

  showCardSelectionUI = true;
  isMyTurn = false; // ajuste sua lógica real
  leftCards: Card[] = [
    { id: 'L1', value: 1 }, { id: 'L2', value: 2 }, { id: 'L3', value: 3 }, { id: 'L4', value: 4 }, { id: 'L5', value: 5 }
  ];
  rightCards: Card[] = [
    { id: 'R1', value: 1 }, { id: 'R2', value: 2 }, { id: 'R3', value: 3 }, { id: 'R4', value: 4 }, { id: 'R5', value: 5 }
  ];

  startCardSelectionFor(category: any, wheelPoints?: number) {
    this.categoriaSelecionada = category;
    this.showCardSelectionUI = true;
    this.isMyTurn = true; // ajuste conforme a lógica real
    // garantir que o componente tenha sido mostrado, o jogador escolhe então onCardChosen será chamado
  }

  onCardPickRequested(e: { side: 'left'|'right'; cardId: string; value: number }) {
    // 1) bloquear UI/indicar "aguardando servidor" se quiser
    // this.showWaitingForServer = true;

    // 2) enviar para backend (STOMP) — exemplo sem lib específica:
    // this.stomp.send('/app/room/' + this.roomId + '/pick', JSON.stringify({
    //   roomId: this.roomId, by: this.myUserId, side: e.side, cardId: e.cardId
    // }));

    // 3) (opcional) aplicar optimistic UI:
    // this.cardSelectionRef?.forcePick(e.side, e.cardId);

    // 4) guardar temporariamente qual carta foi escolhida localmente (opcional)
    // this.lastRequestedPick = e;
  }

}
