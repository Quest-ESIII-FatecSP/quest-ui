import { Component, OnInit, ViewChild } from '@angular/core';
import { QuestWheelComponent } from '../../components/quest-wheel/quest-wheel.component';
import { RoomService } from "./room.service";
import { Card, CardSelectionComponent, Side } from '../../components/card-selection/card-selection.component';
import { ActivatedRoute } from "@angular/router";
import { StompService } from "../../services/stomp.service";
import { IMessage } from "@stomp/stompjs";
import { IQuestion } from "../../model/IQuestion";
import { THEMES } from "@shared/constants/theme.constants";
import { WheelSector } from "../../model/ITheme";
import { JogadorService, TipoJogadorEnum } from "../../services/jogador.service";
import { IPlayer } from "../../model/IPlayer";
import { IPlayerAwaitingTheme } from '../../model/IPlayerAwaitingTheme';
import { TipoPoder } from '../../enum/TipoPoder.enum';

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

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss']
})
export class RoomComponent implements OnInit {
  constructor(private roomService: RoomService,
    private route: ActivatedRoute,
    private stompService: StompService,
    private jogadorService: JogadorService) { }

  @ViewChild(QuestWheelComponent) wheel?: QuestWheelComponent;

  showJumpscare = false;
  jumpscareImage = '';
  roomId = '';
  showQuestionSection: boolean = false;
  showWheelSection: boolean = true;
  showCardSection: boolean = false;
  roletaTravada: boolean = false;
  question: IQuestion | null = null;
  selectedTheme: string | null = null;
  availableCards: number[] = []
  isMyTurn = true;
  shouldSpin = true;
  allThemes: WheelSector[] = THEMES;
  themeForWheel: WheelSector | null = null;
  player1: IPlayer = { pontuacao: 0 };
  otherPlayer: IPlayer = { pontuacao: 0 };

  player1Powers: Partial<Record<TipoPoder, number>> = {
    [TipoPoder.FREEZE_QUESTIONS]: 0,
    [TipoPoder.MOUSE_ESCAPE]: 0,
    [TipoPoder.JUMP_SCARE]: 0,
    [TipoPoder.VOWEL_X]: 0,
    [TipoPoder.STEAL_QUESTION]: 0
  };

  player2Powers: Partial<Record<TipoPoder, number>> = {
    [TipoPoder.FREEZE_QUESTIONS]: 0,
    [TipoPoder.MOUSE_ESCAPE]: 0,
    [TipoPoder.JUMP_SCARE]: 0,
    [TipoPoder.VOWEL_X]: 0,
    [TipoPoder.STEAL_QUESTION]: 0
  };

  displayTopBar: boolean = false;
  roomTimeLeft = 0
  disableCardsSection: boolean = false;
  disableQuestionSection: boolean = false;
  answeredQuestion: boolean = false

  roletaComecouSpin(event: any) {
    this.roletaTravada = true;
  }

  cannotUsePowers = true;

  themeModalOpen = false;
  // opcional: tempo para fechar automaticamente (ms)
  autoCloseMs = 5000;
  categoriaSelecionada: WheelSector | null = null;
  private autoCloseTimer: any = null;

  useFreezeQuestions() { this.roomService.usePower('FREEZE_QUESTIONS', this.roomId) }
  useStealQuestion() { this.roomService.usePower('STEAL_QUESTION', this.roomId) }
  useMouseEscape() { this.roomService.usePower('MOUSE_ESCAPE', this.roomId) }
  useJumpScare() { this.roomService.usePower('JUMP_SCARE', this.roomId) }
  useVowelX() { this.roomService.usePower('VOWEL_X', this.roomId) }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') ?? '';
    // this.findUserData();
    this.stompRoomSubscription();
  }

  startTimer(seconds: number, onFinish: () => void) {
    this.roomTimeLeft = seconds;

    const interval = setInterval(() => {
      if (this.roomTimeLeft > 0) {
        this.roomTimeLeft--;
      } else {
        clearInterval(interval);
        if (onFinish){
          onFinish()
        }
      }
    }, 1000);
  }

  findUserData(): void {
    this.jogadorService.ObterDadosJogador().subscribe({
      next: (data) => {
        const { avatar, email, moeda, username, tipo } = data;

        if (tipo == TipoJogadorEnum.CONVIDADO) {
          this.player1.tipo = TipoJogadorEnum.CONVIDADO;
          this.player1.username = "Convidado";
          this.player1.avatar = 'assets/img/Variedades F.png'
        } else {
          this.player1.username = username;
          this.player1.avatar = avatar;
          this.player1.moeda = moeda;
          this.player1.email = email;
          this.player1.tipo = tipo ?? TipoJogadorEnum.CONVIDADO;
        }

      }
    });
  }

  stompRoomSubscription() {
    const finalRoomCode = this.route.snapshot.paramMap.get('id');

    this.stompService.subscribe(`/room/${finalRoomCode}`, (message) => {
      console.log(message)
      const eventType = message.headers["event"];
      console.log(message.headers["event"])
      this.isMyTurn = message.headers["active-player-id"] === this.stompService.userID
      this.handleEventType(eventType, '', message)
    });
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

  onAnswerSelected(answerID: number) {
    this.answeredQuestion = true;
    this.roomService.answerQuestion(answerID.toString(), this.roomId)
  }

  closeThemeModal() {
    if (this.autoCloseTimer) { clearTimeout(this.autoCloseTimer); this.autoCloseTimer = null; }
    this.themeModalOpen = false;
  }

  confirmTheme() {
    this.closeThemeModal();
  }

  // !!! LOGICA DE CARD SELECTION !!! //
  @ViewChild('cardSelectionRef') cardSelectionRef?: CardSelectionComponent;

  leftCards: Card[] = [
    { id: 'L1', value: 1 }, { id: 'L2', value: 2 }, { id: 'L3', value: 3 }, { id: 'L4', value: 4 }, { id: 'L5', value: 5 }
  ];
  rightCards: Card[] = [
    { id: 'R1', value: 1 }, { id: 'R2', value: 2 }, { id: 'R3', value: 3 }, { id: 'R4', value: 4 }, { id: 'R5', value: 5 }
  ];

  startCardSelectionFor(category: any, wheelPoints?: number) {
    this.categoriaSelecionada = category;
    this.isMyTurn = true; // ajuste conforme a lógica real
    // garantir que o componente tenha sido mostrado, o jogador escolhe então onCardChosen será chamado
  }

  onCardPickRequested(card: { side: Side; cardId: string; value: number }) {
    if (!this.availableCards.includes(card.value)) return

    this.roomService.choseScoreCard(card.value.toString(), this.roomId)
  }

  checkUsedPower(power: TipoPoder) {
    switch (power) {
      case TipoPoder.FREEZE_QUESTIONS:
        this.useFreezeQuestions();
        break;
      case TipoPoder.MOUSE_ESCAPE:
        this.useMouseEscape();
        break;
      case TipoPoder.JUMP_SCARE:
        this.useJumpScare();
        break;
      case TipoPoder.VOWEL_X:
        this.useVowelX();
        break;
    }
  }

  handleEventType(eventType: string, activePlayer: string, message: IMessage): void {
    switch (eventType) {
      case "AWAITING_THEME_CONFIRMATION_ANIMATION":
        this.handleAwaitingThemeConfirmationAnimation()
        break;
      case "AWAITING_THEME_CONFIRMATION":
        this.handleAwaitingThemeConfirmation(message);
        break;
      case "AWAITING_SCORE_CARD_ANIMATION":
        this.handleAwaitingScoreCardAnimation();
        break;
      case "AWAITING_SCORE_CARD":
        this.handleAwaitingScoreCard(activePlayer, message)
        break;
      case "AWAITING_ANSWER_ANIMATION":
        this.handleAwaitingAnswerAnimation(activePlayer);
        break;
      case "AWAITING_ANSWER":
        this.handleAwaitingAnswer(message);
        break;
      case "ANSWER_RESULT":
        this.handleAnswerResult(message);
        break;
      case "ENABLE_POWERS":
        this.cannotUsePowers = false;
        break;
      case "FREEZE_QUESTIONS_USED":
        this.handlePowerUsed(activePlayer, "Suas alternativas foram congeladas por 5 segundos!", TipoPoder.FREEZE_QUESTIONS);
        break;
      case "MOUSE_ESCAPE_USED":
        this.handlePowerUsed(activePlayer, "As alternativas fugirão do seu mouse por 4 cliques!", TipoPoder.MOUSE_ESCAPE);
        break;
      case "JUMP_SCARE_USED":
        this.handlePowerUsed(activePlayer, "Susto!", TipoPoder.JUMP_SCARE);
        break;
      case "VOWEL_X_USED":
        this.handlePowerUsed(activePlayer, "As vogais e números pares foram substituídos por X!", TipoPoder.VOWEL_X);
        break;
      case "STEAL_QUESTION_USED":
        this.handlePowerUsed(activePlayer, "Sua pergunta foi roubada!", TipoPoder.STEAL_QUESTION);
        break;
      case "FINISHED_GAME":
        this.handleFinishGame(message);
        break;
    }
  }

  handleAwaitingThemeConfirmationAnimation() {
    this.showCardSection = false;
    this.showQuestionSection = false;
    this.showWheelSection = true;
    this.shouldSpin = !this.shouldSpin;
  }

  handleAwaitingThemeConfirmation(message: IMessage) {
    this.cannotUsePowers = true;
    this.selectedTheme = JSON.parse(message.body)['theme'];
    this.themeForWheel = this.allThemes.find(value => value.label === this.selectedTheme) ?? null;

    const players: IPlayerAwaitingTheme[] = JSON.parse(message.body)['players'];

    console.log(JSON.stringify(players, null, 2));

    players.forEach(p => {
      if (p.id == this.stompService.userID) {
        this.player1.username = p.name;
        this.player1.avatar = p.avatar;
        this.player1.id = p.id;

        this.player1Powers = {
          [TipoPoder.FREEZE_QUESTIONS]: p.inventario?.FREEZE_QUESTIONS,
          [TipoPoder.MOUSE_ESCAPE]: p.inventario?.MOUSE_ESCAPE,
          [TipoPoder.JUMP_SCARE]: p.inventario?.JUMP_SCARE,
          [TipoPoder.VOWEL_X]: p.inventario?.VOWEL_X,
          [TipoPoder.STEAL_QUESTION]: 0
        };

      } else {
        this.otherPlayer.username = p.name;
        this.otherPlayer.avatar = p.avatar;
        this.otherPlayer.id = p.id;

        this.player2Powers = {
          [TipoPoder.FREEZE_QUESTIONS]: p.inventario?.FREEZE_QUESTIONS,
          [TipoPoder.MOUSE_ESCAPE]: p.inventario?.MOUSE_ESCAPE,
          [TipoPoder.JUMP_SCARE]: p.inventario?.JUMP_SCARE,
          [TipoPoder.VOWEL_X]: p.inventario?.VOWEL_X,
          [TipoPoder.STEAL_QUESTION]: 0
        }
      }
    });

    this.displayTopBar = true;

    console.log(this.themeForWheel);
  }

  handleAwaitingScoreCardAnimation() {
    this.showWheelSection = false
    this.disableCardsSection = false;
    this.showCardSection = true
    this.disableQuestionSection = false
    this.showQuestionSection = false
  }

  handleAwaitingScoreCard(activePlayer: string, message: IMessage) {
    this.availableCards = JSON.parse(message.body) as number[];
    this.startTimer(5, () => {
      this.disableCardsSection = true;
    })
    console.log(this.availableCards)
  }

  handleAwaitingAnswerAnimation(activePlayer: string) {

  }

  handleAwaitingAnswer(message: IMessage) {
    this.question = JSON.parse(message.body);
    console.log(this.question)
    this.showQuestionSection = true
    this.startTimer(15, () => {
      if (!this.answeredQuestion){
        this.disableQuestionSection = true
        this.roomService.answerQuestion(null, this.roomId)
      }
      this.answeredQuestion = false
    })
  }

  handleAnswerResult(message: any) {
    const result = JSON.parse(message.body);

    const pontuacao: Map<string, number> = new Map(Object.entries(result.scorePerPlayer));
    this.player1.pontuacao = pontuacao.get(this.stompService.userID)
    pontuacao.forEach((v, k) => {
      if (k != this.stompService.userID) {
        this.otherPlayer.pontuacao = v;
      }
    })
  }

  handlePowerUsed(activePlayer: string, message: string, tipo: TipoPoder) {
    this.player1Powers[tipo] = (this.player1Powers[tipo] || 1) - 1;

    switch(tipo) {
      case TipoPoder.FREEZE_QUESTIONS:
        break;
      case TipoPoder.MOUSE_ESCAPE:
        break;
      case TipoPoder.JUMP_SCARE:
        this.triggerJumpscare();
        break;
      case TipoPoder.VOWEL_X:
        break;
    }
  }

  triggerJumpscare() {
    if(!this.isMyTurn) return;

    const images = [
      'assets/jumpscare/jump1.jpg',
      'assets/jumpscare/jump2.jpg',
      'assets/jumpscare/jump3.jpg',
    ];

    // áudios disponíveis
    const sounds = [
      'assets/sons/poderes/jumpscare 1.m4a',
      'assets/sons/poderes/jumpscare 2.m4a',
      'assets/sons/poderes/jumpscare 3.m4a',
    ];

    const img = images[Math.floor(Math.random() * images.length)];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];

    this.jumpscareImage = img;
    this.showJumpscare = true;

    const audio = new Audio(sound);
    audio.volume = 1;
    audio.play().catch(err => console.warn("Erro ao tocar jumpscare:", err));

    // remover depois de 1.4s
    setTimeout(() => {
      this.showJumpscare = false;
    }, 1400);
  }

  // colocar em um modal dps
  handleFinishGame(message: IMessage) {
    const response = JSON.parse(message.body);
    const finalScore: Map<string, number> = new Map(Object.entries(response.scorePerPlayer));

    let winner;
    if (this.player1.id === response['winnerPlayerID']){
      winner = {...this.player1};
    } else {
      winner = {...this.otherPlayer};
    }
    alert(`Parabéns, ${winner.username}! Você venceu o jogo com ${finalScore.get(winner.id!)} pontos!`);
  }


}
