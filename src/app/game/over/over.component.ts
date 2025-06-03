import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { GameManagerService } from '../shared/game-manager.service';
import { ScoreEntry } from '../shared/game.types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-over',
  standalone: true,
  imports: [RouterModule, CommonModule ],
  templateUrl: './over.component.html',
  styleUrl: './over.component.scss'
})
export class OverComponent implements OnInit {
  scoreboard: ScoreEntry[] = [];
  scorePublished = false;

  constructor(public gameManager: GameManagerService, private readonly router: Router) {}
  
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.router.navigate(['/play']);
    }
  }
  
  ngOnInit() {
    this.scoreboard = this.gameManager.getScoreboard();
  } 

  playAgain() {
    this.router.navigate(['/play']);
  }

  goToMenu() {
    this.router.navigate(['/menu']);
  }

  publishScore() {
    this.scorePublished = true;

    const entry: ScoreEntry = {
      score: this.gameManager.getScore(),
      timePlayedSeconds: Math.floor(this.gameManager.getTimePlayed() / 1000),
      difficulty: this.gameManager.getDifficulty(),
      date: new Date().toISOString()
    };
    this.gameManager.addScoreEntry(entry);

    this.scoreboard = this.gameManager.getScoreboard();
  }
}
