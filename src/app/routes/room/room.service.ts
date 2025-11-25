import { Injectable } from '@angular/core';
import {StompService} from "../../services/stomp.service";
import {IMessage} from "@stomp/stompjs";

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
    });
  }

  answerQuestion(choosenAnswerID: string | null, idSala: string) {
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

}
