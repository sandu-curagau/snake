import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GameManagerService } from '../shared/game-manager.service';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
  
  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Game grid settings
  cols!: number;
  rows!: number;
  tileSize = 40;

  constructor(public gameManager: GameManagerService) {
    console.log('difficulty ', gameManager.getDifficulty());
    console.log('mode ', gameManager.getMode());
    console.log('enemy count ', gameManager.getEnemyCount());
  }

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.setupMapSize();
    this.resizeCanvas(canvas);
    this.drawGrid();
    
    this.startGame();
  }

  setupMapSize() {
    const mode = this.gameManager.getMode();
    const enemies = this.gameManager.getEnemyCount();

    if (mode === this.gameManager.Mode.Singleplayer || (mode === this.gameManager.Mode.PvE && enemies === 1)) {
      this.cols = 20;
      this.rows = 15;
    } else {
      this.cols = 40;
      this.rows = 30;
    }
  }

  resizeCanvas(canvas: HTMLCanvasElement) {
    canvas.width = this.cols * this.tileSize;
    canvas.height = this.rows * this.tileSize;
  }

  drawGrid() {
    this.ctx.strokeStyle = '#333';
    for (let x = 0; x <= this.cols; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.tileSize, 0);
      this.ctx.lineTo(x * this.tileSize, this.rows * this.tileSize);
      this.ctx.stroke();
    }

    for (let y = 0; y <= this.rows; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.tileSize);
      this.ctx.lineTo(this.cols * this.tileSize, y * this.tileSize);
      this.ctx.stroke();
    }
  }


  startGame() {
    console.log('Game started with map:', this.cols, 'x', this.rows);
    // Proceed with game setup (snake, food, loop...)
  }

}
