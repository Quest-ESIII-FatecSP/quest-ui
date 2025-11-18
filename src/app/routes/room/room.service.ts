import { Injectable } from '@angular/core';
import {StompService} from "../../services/stomp.service";

@Injectable({
  providedIn: 'root'
})
export class RoomService {

  constructor(private stompService: StompService) {
  }

  processAction(idSala: string, body: string, actionType: string): void {
    this.stompService.publish({
      destination: '/room/' + idSala + '/action',
      body,
      headers: {
        "user-id": this.stompService.userID,
        "action-type": actionType // USE_POWER, CHOOSE_SCORE_CARD, ANSWER_QUESTION
      }
    })
  }

  answerQuestion(choosenAnswerID: string, idSala: string) {
    if (!idSala) return;
    const body = JSON.stringify({
      choosenAnswerID
    });
    this.processAction(idSala, body, 'ANSWER_QUESTION')
  }

  choseScoreCard(chosenScoreCard: string, idSala: string) {
    if (!idSala) return
    const body = JSON.stringify({
      chosenScoreCard
      });
    this.processAction(idSala, body, 'CHOOSE_SCORE_CARD')
  }

  usePower(powerType: string, idSala: string) {
    if (!idSala) return
    const body = JSON.stringify({
      powerType
    });

    this.processAction(idSala, body, 'USE_POWER')
  }

  handleEventType(eventType: string, activePlayer: string): void {
    switch (eventType) {
      case "AWAITING_THEME_CONFIRMATION_ANIMATION":
        this.handleAwaitingThemeConfirmationAnimation(activePlayer)
        break;
      case "AWAITING_THEME_CONFIRMATION":
        this.handleAwaitingThemeConfirmation(activePlayer);
        break;
      case "AWAITING_SCORE_CARD_ANIMATION":
        this.handleAwaitingScoreCardAnimation(activePlayer);
        break;
      case "AWAITING_SCORE_CARD":
        this.handleAwaitingScoreCard(activePlayer)
        break;
      case "AWAITING_ANSWER_ANIMATION":
        this.handleAwaitingAnswerAnimation(activePlayer);
        break;
      case "AWAITING_ANSWER":
        this.handleAwaitingAnswer(activePlayer);
        break;
      case "ANSWER_RESULT":
        this.handleAnswerResult('');
        break;
      case "FREEZE_QUESTIONS_USED":
        this.handlePowerUsed(activePlayer, "Suas alternativas foram congeladas por 5 segundos!");
        break;
      case "MOUSE_ESCAPE_USED":
        this.handlePowerUsed(activePlayer, "As alternativas fugirão do seu mouse por 4 cliques!");
        break;
      case "JUMP_SCARE_USED":
        this.handlePowerUsed(activePlayer, "Susto!");
        break;
      case "VOWEL_X_USED":
        this.handlePowerUsed(activePlayer, "As vogais e números pares foram substituídos por X!");
        break;
      case "STEAL_QUESTION_USED":
        this.handlePowerUsed(activePlayer, "Sua pergunta foi roubada!");
        break;
    }
  }

  handleAwaitingThemeConfirmationAnimation(activePlayer: any) {

  }

  handleAwaitingThemeConfirmation(activePlayer: string) {

  }

  handleAwaitingScoreCardAnimation(activePlayer: string) {

  }

  handleAwaitingScoreCard(activePlayer: string) {

  }

  handleAwaitingAnswerAnimation(activePlayer: string) {

  }

  handleAwaitingAnswer(activePlayer: string) {

  }

  handleAnswerResult(answerResult: any) {

  }

  handlePowerUsed(activePlayer: string, message: string) {}

}
