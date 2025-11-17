import {Component, OnInit} from '@angular/core';
import {StompService} from "../../services/stomp.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrl: './room.component.scss'
})
export class RoomComponent implements OnInit{
  idSala: string | null = "";
  spinnerMsg: string = "";
  pergunta: any | undefined;
  isTurno: boolean = false;
  exibePergunta: boolean = false;
  pontuacaoAtual: number | undefined = 0;
  pontuacaoAdversario: number | undefined = 0;
  // controla se os botões de poderes devem ser exibidos para o jogador não-ativo
  showPowerButtons: boolean = false;
  aguardandoResposta: boolean = false;


  constructor(private router: Router,
              private stompService: StompService,
              private route: ActivatedRoute){
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params:any) => {
      const idSala = params.get("idSala");
      this.idSala = idSala;
      this.stompService.subscribe("/room/" + idSala, (message: any) => {
        const tipoEvento = message.headers["event"];
        const activePlayer = message.headers["active-player-id"]
        switch (tipoEvento) {
          case "AWAITING_THEME_CONFIRMATION_ANIMATION":
            this.handleAwaitingThemeConfirmationAnimation(activePlayer)
            break;
          case "AWAITING_THEME_CONFIRMATION":
            this.handleAwaitingThemeConfirmation(activePlayer, JSON.parse(message.body));
            break;
          case "AWAITING_SCORE_CARD_ANIMATION":
            this.handleAwaitingScoreCardAnimation(activePlayer);
            break;
          case "AWAITING_SCORE_CARD":
            this.handleAwaitingScoreCard(activePlayer, JSON.parse(message.body))
            break;
          case "AWAITING_ANSWER_ANIMATION":
            this.handleAwaitingAnswerAnimation(activePlayer);
            break;
          case "AWAITING_ANSWER":
            this.handleAwaitingAnswer(activePlayer, JSON.parse(message.body));
            break;
          case "ANSWER_RESULT":
            this.handleAnswerResult(JSON.parse(message.body));
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
      });

      this.stompService.publish({destination: `/room/${idSala}/${this.stompService.userID}`})
    });
  }

  handleAwaitingThemeConfirmationAnimation(activePlayer: any) {
    this.exibePergunta = false;
    if (activePlayer == this.stompService.userID) {
      this.spinnerMsg = "Nesse evento, exibir animação da roleta para o jogador ativo"
    } else {
      this.spinnerMsg = "Teste jogador não ativo"
    }
  }

  handleAwaitingThemeConfirmation(activePlayer: string, payload: any) {
    const theme = payload.theme;
    if (activePlayer == this.stompService.userID) {
      this.spinnerMsg = `Tema sorteado: ${theme}. Aqui terá uma janela de 5 segundos para re-rolar a roleta`
    } else {
      this.spinnerMsg = "Teste jogador não ativo"
    }
  }

  handleAwaitingScoreCardAnimation(activePlayer: string) {
    this.exibePergunta = false;
    if (activePlayer == this.stompService.userID) {
      this.spinnerMsg = "Animação para escolha dos cartões de ponto (O.B.S.: A escolha de fato só pode ser feita no próximo evento AWAITING_SCORE_CARD)"
    } else {
      this.spinnerMsg = "Teste jogador não ativo"
    }
  }

  handleAwaitingScoreCard(activePlayer: string, payload: any) {
    if (activePlayer == this.stompService.userID) {
      this.spinnerMsg = "Exibir as opções de cartão de pontuação"
    } else {
      this.spinnerMsg = "Teste jogador não ativo"
    }
  }

  handleAwaitingAnswerAnimation(activePlayer: string) {
    // TODO: animações para se preparar para responder a pergunta, etc.
    // durante a animação, esconder os botões por segurança
    this.showPowerButtons = false;
  }

  handleAwaitingAnswer(activePlayer: string, pergunta: any) {
    this.pergunta = pergunta;
    if (activePlayer == this.stompService.userID) {
      this.spinnerMsg = "Jogando..."
      this.exibePergunta = true;
      this.showPowerButtons = false;
    } else {
      this.exibePergunta = false;
      this.spinnerMsg = "Aguardando adversário..."
      // jogador não-ativo: mostrar os botões de poderes para tentar atrapalhar
      this.showPowerButtons = true;
    }
  }

  handleAnswerResult(answerResult: any) {
    const flAcerto: boolean = answerResult.rightAnswer;
    if (flAcerto) {
      if (this.aguardandoResposta) {
        console.log("Acertou!")
      } else {
        console.log("Adversário acertou!")
      }
    } else {
      if (this.aguardandoResposta) {
        console.log("Errou!")
      } else {
        console.log("Adversário errou!")
      }
    }
    const pontuacao: Map<string, number> = new Map(Object.entries(answerResult.scorePerPlayer));

    this.pontuacaoAtual = pontuacao.get(this.stompService.userID);
    pontuacao.forEach((v, k) => {
      if (k != this.stompService.userID) {
        this.pontuacaoAdversario = v;
      }
    })
    this.aguardandoResposta = false;
  }

  handlePowerUsed(activePlayer: string, mensagem: string) {
    // Se não for o jogador ativo, ignora (apenas o jogador afetado vê a mensagem)
    if (activePlayer != this.stompService.userID) return;

    console.log("Poder usado: " + mensagem, 'Fechar', {
      duration: 5000, // 5 segundos
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  answerQuestion(resposta: any) {
    this.aguardandoResposta = true
    const idResposta = resposta.answerID;
    this.stompService.publish({
      destination: '/room/' + this.idSala + '/action',
      body: JSON.stringify({
        choosenAnswerID: idResposta
      }),
      headers: {
        "user-id": this.stompService.userID, // trocar por token
        "action-type": "ANSWER_QUESTION"
      }
    });
  }

  usePower(powerType: string) {
    if (!this.idSala) return
    this.stompService.publish({
      destination: '/room/' + this.idSala + '/action',
      body: JSON.stringify({
        powerType: powerType
      }),
      headers: {
        "user-id": this.stompService.userID,
        "action-type": "USE_POWER"
      }
    })
  }

  freezeQuestions() { this.usePower('FREEZE_QUESTIONS') }
  mouseEscape() { this.usePower('MOUSE_ESCAPE') }
  jumpScare() { this.usePower('JUMP_SCARE') }
  vowelX() { this.usePower('VOWEL_X') }
  stealQuestion() { this.usePower('STEAL_QUESTION') }



}
