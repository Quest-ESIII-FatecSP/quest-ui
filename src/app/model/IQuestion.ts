export interface IQuestion {
  question: string;
  stolen: boolean;
  turn: number
  answers: IAnswer[];
}

export interface IAnswer {
  answerID: number;
  answerText: string;
  rightAnswer: boolean;
}
