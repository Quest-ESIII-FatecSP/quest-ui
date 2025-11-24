import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
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
  @Input() disableAlternatives: boolean = false;
  @Output() answerSelected = new EventEmitter<number>();

  selectedAnswerID: number | null = null;
  correctanswerID: number | null = null;

  ngOnInit(): void {
    this.correctanswerID = this.question?.answers.find(ans => ans.rightAnswer)?.answerID || null;
    console.log(this.correctanswerID)
  }

  onSelectAlternative(alt: IAnswer): void {
    if (!this.isMyTurn) return;
    if (this.reveal) return;
    this.selectedAnswerID = alt.answerID
    this.answerSelected.emit(alt.answerID);
  }

  /** Verifica se alternativas devem estar desabilitadas */
  isDisabled(): boolean {
    if (!this.isMyTurn || this.reveal || this.disableAlternatives) return true;
    return false;
  }

  getAlternativeState(id: number): '' | 'correct' | 'wrong' {
    if (!this.selectedAnswerID && !this.disableAlternatives) return '';

    if (this.disableAlternatives){
      if (id === this.correctanswerID) return 'correct';
      return 'wrong';
    }
    const isCorrect = id === this.correctanswerID;
    const isPlayerChoice = id === this.selectedAnswerID;

    if (isCorrect) return 'correct';
    if (isPlayerChoice && !isCorrect) return 'wrong';
    return '';
  }
}
