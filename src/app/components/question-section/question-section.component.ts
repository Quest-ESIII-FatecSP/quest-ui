import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IAnswer, IQuestion} from "../../model/IQuestion";

export interface QuestionAlternative {
  id: string;
  text: string;
}

@Component({
  selector: 'app-question-section',
  templateUrl: './question-section.component.html',
  styleUrl: './question-section.component.scss'
})
export class QuestionSectionComponent implements OnInit {
  @Input() question: IQuestion | null = null;
  @Input() isMyTurn: boolean = true;
  @Input() reveal: boolean = false;
  @Input() categoryName: string | null = null;
  @Output() answerSelected = new EventEmitter<number>();

  correctanswerID: number | null = null;
  playeranswerID: number | null = null
  localClickedId: number | null = null;

  ngOnInit(): void {
    console.log(this.question)
    this.correctanswerID = this.question?.answers.find(ans => ans.rightAnswer)?.answerID || null;
    console.log(this.correctanswerID)
  }

  onSelectAlternative(alt: IAnswer): void {
    if (!this.isMyTurn) return;
    if (this.reveal) return;
    this.getAlternativeState(alt.answerID)
    this.answerSelected.emit(alt.answerID);
  }

  /** Verifica se alternativas devem estar desabilitadas */
  isDisabled(): boolean {
    if (!this.isMyTurn) return true;
    if (this.reveal) return true;
    return false;
  }

  getAlternativeState(id: number): 'neutral' | 'correct' | 'wrong' {

    const isCorrect = id === this.correctanswerID;
    const isPlayerChoice = id === this.playeranswerID;

    if (isCorrect) return 'correct';
    if (isPlayerChoice && !isCorrect) return 'wrong';
    return 'correct';
  }
}
