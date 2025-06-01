export enum Difficulty {
  Easy = 'Easy',
  Normal = 'Normal',
  Hard = 'Hard',
  Impossible = 'Impossible'
}

export enum Mode {
  Singleplayer = 'Singleplayer',
  PvE = 'PvE',
}

export interface GameState {
  difficulty: Difficulty;
  mode: Mode;
  score: number;
  timePlayedMs: number;
  isGameOver: boolean;
}
