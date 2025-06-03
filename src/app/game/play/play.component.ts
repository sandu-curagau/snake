import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { GameManagerService } from '../shared/game-manager.service';
import { Direction, Point, ScoreEntry } from '../shared/game.types';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
  gameStarted = false;
  isPaused = false;

  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private crc!: CanvasRenderingContext2D;

  // Game grid settings
  cols!: number;
  rows!: number;
  tileSize = 40;

  // Game state
  private snake: { x: number, y: number }[] = [];
  private direction: Direction = Direction.Right;
  private nextDirection: Direction = Direction.Right;
  private food!: { x: number, y: number };
  private intervalId: any;
  startTime: any;

  // Later, to support PvE
  enemies: Point[][] = []; // Each enemy is a snake (array of points)
  enemyDirections: Direction[] = [];

  constructor(public gameManager: GameManagerService, private router: Router) {
    console.log('difficulty ', gameManager.getDifficulty());
    console.log('mode ', gameManager.getMode());
    console.log('enemy count ', gameManager.getEnemyCount());
  }

  ngOnInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.crc = canvas.getContext('2d')!;

    this.setupMapSize();
    this.resizeCanvas(canvas);
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

  startGame() {
    this.initGame();
    this.drawOverlayScreen('Press SPACE to start');

    const listener = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.gameStarted = true;
        this.startTime = Date.now();
        this.intervalId = setInterval(() => this.gameLoop(), this.getSpeed());
        window.removeEventListener('keydown', listener);
      }
    };

    window.addEventListener('keydown', listener);
  }

  initGame() {
    this.snake = [{ x: 5, y: 5 }];
    this.direction = Direction.Right;
    this.nextDirection = Direction.Right;
    this.spawnFood();
  }

  drawOverlayScreen(text: string) {
    this.crc.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.crc.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

    this.crc.fillStyle = 'white';
    this.crc.font = '30px Arial';
    this.crc.textAlign = 'center';
    this.crc.fillText(
      text,
      (this.cols * this.tileSize) / 2,
      (this.rows * this.tileSize) / 2
    );
  }

  getSpeed(): number {
    const difficulty = this.gameManager.getDifficulty();
    switch (difficulty) {
      case this.gameManager.Difficulty.Easy: return 250;
      case this.gameManager.Difficulty.Normal: return 150;
      case this.gameManager.Difficulty.Hard: return 100;
      case this.gameManager.Difficulty.Impossible: return 50;
      default: return 150;
    }
  }

  gameLoop() {
    this.update();
    this.draw();
  }

  update() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case Direction.Up: head.y--; break;
      case Direction.Down: head.y++; break;
      case Direction.Left: head.x--; break;
      case Direction.Right: head.x++; break;
    }

    // Wall or self-collision
    if (
      head.x < 0 || head.y < 0 ||
      head.x >= this.cols || head.y >= this.rows ||
      this.snake.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.gameManager.setScore(this.gameManager.getScore() + 1);
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  draw() {
    // Clear canvas
    this.crc.fillStyle = 'black';
    this.crc.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

    // Draw snake with gradient segments
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i];
      const isHead = i === 0;

      const x = segment.x * this.tileSize;
      const y = segment.y * this.tileSize;

      const gradient = this.crc.createLinearGradient(x, y, x + this.tileSize, y + this.tileSize);
      if (isHead) {
        gradient.addColorStop(0, '#b6ff00');
        gradient.addColorStop(1, '#66cc00');
      } else {
        gradient.addColorStop(0, '#00cc00');
        gradient.addColorStop(1, '#004d00');
      }

      this.crc.fillStyle = gradient;
      this.crc.fillRect(x, y, this.tileSize, this.tileSize);

      // 🧿 Add eyes to the head
      if (isHead) {
        const eyeRadius = this.tileSize * 0.1;
        const spacing = this.tileSize * 0.25;

        let eye1 = { x: 0, y: 0 };
        let eye2 = { x: 0, y: 0 };

        switch (this.direction) {
          case Direction.Up:
            eye1 = { x: x + spacing, y: y + spacing };
            eye2 = { x: x + this.tileSize - spacing, y: y + spacing };
            break;
          case Direction.Down:
            eye1 = { x: x + spacing, y: y + this.tileSize - spacing };
            eye2 = { x: x + this.tileSize - spacing, y: y + this.tileSize - spacing };
            break;
          case Direction.Left:
            eye1 = { x: x + spacing, y: y + spacing };
            eye2 = { x: x + spacing, y: y + this.tileSize - spacing };
            break;
          case Direction.Right:
            eye1 = { x: x + this.tileSize - spacing, y: y + spacing };
            eye2 = { x: x + this.tileSize - spacing, y: y + this.tileSize - spacing };
            break;
        }

        this.crc.fillStyle = 'white';
        this.crc.beginPath();
        this.crc.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2);
        this.crc.fill();

        this.crc.beginPath();
        this.crc.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2);
        this.crc.fill();
      }
    }

    // Draw food
    this.crc.fillStyle = 'red';
    this.crc.fillRect(
      this.food.x * this.tileSize,
      this.food.y * this.tileSize,
      this.tileSize,
      this.tileSize
    );
  }

  spawnFood() {
    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
    } while (this.snake.some(s => s.x === x && s.y === y));
    this.food = { x, y };
  }

  endGame() {
    clearInterval(this.intervalId);
    this.gameManager.setGameOver(true);

    this.gameManager.setTimePlayed(Date.now() - this.startTime);

    this.router.navigate(['/game-over']); // Angular routing, no reload
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    const key = e.key;

    // Pause toggle with P
    if (key === 'p' || key === 'P') {
      this.togglePause();
      return;
    }

    // If paused, ignore movement input
    if (this.isPaused) return;

    const opposite: Record<Direction, Direction> = {
      [Direction.Up]: Direction.Down,
      [Direction.Down]: Direction.Up,
      [Direction.Left]: Direction.Right,
      [Direction.Right]: Direction.Left,
    };

    const keyToDirection: Record<string, Direction> = {
      ArrowUp: Direction.Up,
      ArrowDown: Direction.Down,
      ArrowLeft: Direction.Left,
      ArrowRight: Direction.Right,
    };

    if (key in keyToDirection) {
      const newDirection = keyToDirection[key];
      if (newDirection !== opposite[this.direction]) {
        this.nextDirection = newDirection;
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.drawOverlayScreen('Paused — Press P to resume');
    } else {
      this.resumeGameLoop();
    }
  }

  resumeGameLoop() {
    this.intervalId ??= setInterval(() => this.gameLoop(), this.getSpeed());
  }


}
