import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Difficulty, GameState, Mode, ScoreEntry } from './game.types';

@Injectable({
  providedIn: 'root',
})
export class GameManagerService {
  private readonly STORAGE_KEY = 'snakeScoreboard';

  private readonly state: GameState = {
    difficulty: Difficulty.Normal,
    mode: Mode.Singleplayer,
    score: 0,
    timePlayedMs: 0,
    isGameOver: false,
  };
  
  difficulty$ = new BehaviorSubject<Difficulty>(Difficulty.Normal);
  mode$ = new BehaviorSubject<Mode>(Mode.Singleplayer);
  enemyCount$ = new BehaviorSubject<number>(1);

  readonly maxEnemyCount = 5;

  readonly Difficulty = Difficulty;
  readonly difficulties = Object.values(Difficulty);
  readonly Mode = Mode;
  readonly modes = Object.values(Mode);

  setDifficulty(diff: Difficulty) {
    this.difficulty$.next(diff);
  }

  getDifficulty(): Difficulty {
    return this.difficulty$.getValue();
  }

  setMode(mode: Mode) {
    this.mode$.next(mode);
  }

  getMode(): Mode {
    return this.mode$.getValue();
  }

  setEnemyCount(count: number) {
    if (count >= 1 && count <= this.maxEnemyCount) {
      this.enemyCount$.next(count);
    }
  }

  getEnemyCount(): number {
    return this.enemyCount$.getValue();
  }

  getMaxEnemyCount(): number[] {
    return Array.from({ length: this.maxEnemyCount }, (_, i) => i + 1);
  }


  resetGame() {
    this.state.score = 0;
    this.state.timePlayedMs = 0;
    this.state.isGameOver = false;
  }

  setScore(score: number) {
    this.state.score = score;
  }

  getScore() {
    return this.state.score;
  }

  setTimePlayed(ms: number) {
    this.state.timePlayedMs = ms;
  }

  getTimePlayed() {
    return this.state.timePlayedMs;
  }

  setGameOver(value: boolean) {
    this.state.isGameOver = value;
  }

  isGameOver() {
    return this.state.isGameOver;
  }

  getState(): GameState {
    return { ...this.state };
  }

  getScoreboard(): ScoreEntry[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as ScoreEntry[];
    } catch {
      return [];
    }
  }

  addScoreEntry(entry: ScoreEntry) {
    const scoreboard = this.getScoreboard();
    scoreboard.push(entry);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scoreboard));
  }
}
