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

export enum Style {
  Classic = 'Classic',
  Endless = 'Endless',
}

export interface GameState {
  difficulty: Difficulty;
  mode: Mode;
  style: Style;
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
  mode: Mode;
  score: number;
  timePlayedSeconds: number;
  difficulty: string;
  date: string;  
}

export interface AISnake {
  body: { x: number, y: number }[];
  direction: Direction;
  color: string;
  lastHeadPos?: { x: number; y: number };
}