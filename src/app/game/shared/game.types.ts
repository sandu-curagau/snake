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

export enum Direction {
  Up,
  Down,
  Left,
  Right
}

export interface Point {
  x: number;
  y: number;
}

export interface ScoreEntry {
  score: number;
  timePlayedSeconds: number;
  difficulty: string;
  date: string;  
}

export interface AISnake {
  body: { x: number, y: number }[];
  direction: Direction;
  color: string;
}