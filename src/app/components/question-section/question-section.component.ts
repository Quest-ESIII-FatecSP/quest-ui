import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IAnswer, IQuestion} from "../../model/IQuestion";

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
  correctAnswerID: number | null = null;

  ngOnInit(): void {
    this.correctAnswerID = this.question?.answers.find(ans => ans.rightAnswer)?.answerID || null;
    console.log(this.question)
    console.log(this.correctAnswerID)
  }

  onSelectAlternative(alt: IAnswer): void {
    if (!this.isMyTurn) return;
    this.selectedAnswerID = alt.answerID
    this.answerSelected.emit(alt.answerID);
  }

  /** Verifica se alternativas devem estar desabilitadas */
  isDisabled(): boolean {
    return !this.isMyTurn || this.disableAlternatives;
  }

  getAlternativeState(id: number): '' | 'correct' | 'wrong' {
    if (!this.selectedAnswerID && !this.disableAlternatives) return '';

    if (this.disableAlternatives){
      if (id === this.correctAnswerID) return 'correct';
      return 'wrong';
    }
    const isCorrect = id === this.correctAnswerID;
    const isPlayerChoice = id === this.selectedAnswerID;

    if (isCorrect) return 'correct';
    if (isPlayerChoice && !isCorrect) return 'wrong';
    return '';
  }
}
