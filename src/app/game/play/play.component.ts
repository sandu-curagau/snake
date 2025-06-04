import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { GameManagerService } from '../shared/game-manager.service';
import { AISnake, Direction, Point, ScoreEntry } from '../shared/game.types';

@Component({
  selector: 'app-play',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './play.component.html',
  styleUrl: './play.component.scss'
})
export class PlayComponent implements OnInit {
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
  private food: { x: number, y: number }[] = [];
  private intervalId: any;
  private startTime: any;
  private enemySnakes: AISnake[] = [];

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
      this.cols = 20 + (3 * this.gameManager.getEnemyCount());
      this.rows = 15 + (1 * this.gameManager.getEnemyCount());
    }
  }

  resizeCanvas(canvas: HTMLCanvasElement) {
    canvas.width = this.cols * this.tileSize;
    canvas.height = this.rows * this.tileSize;
  }

  startGame() {
    this.initGame();
    this.setupEnemySnakes();
    this.drawOverlayScreen('Press SPACE to start');

    const listener = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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
    
    // initial food
    for (let i = 0; i < 1 + this.gameManager.getEnemyCount(); i++) {
      this.spawnFood();
    }
  }

  setupEnemySnakes() {
    if (this.gameManager.getMode() === this.gameManager.Mode.PvE) {
      for (let i = 0; i < this.gameManager.getEnemyCount(); i++) {
        this.spawnEnemySnake();
      }
    }
  }

  spawnEnemySnake() {
    let spawnPos;
    do {
      spawnPos = {
        x: Math.floor(Math.random() * this.cols),
        y: Math.floor(Math.random() * this.rows),
      };
    } while (this.distance(spawnPos, this.snake[0]) < 8);

    const aiSnake: AISnake = {
      body: [spawnPos],
      direction: Direction.Left,
      color: this.getRandomOrangeColor(),
    };

    this.enemySnakes.push(aiSnake);
  }

  distance(a: {x: number, y: number}, b: {x: number, y: number}): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  getRandomOrangeColor(): string {
    const hue = 30 + Math.random() * 20;
    const saturation = 90 + Math.random() * 10;
    const lightness = 45 + Math.random() * 10;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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

  gameLoop() {
    this.update();
    this.draw();
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

  update() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case Direction.Up: head.y--; break;
      case Direction.Down: head.y++; break;
      case Direction.Left: head.x--; break;
      case Direction.Right: head.x++; break;
    }

    // Wall or self or enemy snake
    if (
      head.x < 0 || head.y < 0 ||
      head.x >= this.cols || head.y >= this.rows ||
      this.snake.some(seg => seg.x === head.x && seg.y === head.y) ||
      this.enemySnakes.some(ai => ai.body.some(seg => seg.x === head.x && seg.y === head.y))
    ) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    const foodIndex = this.food.findIndex(f => f.x === head.x && f.y === head.y);

    if (foodIndex !== -1) {
      this.food.splice(foodIndex, 1); // remove eaten food
      this.gameManager.setScore(this.gameManager.getScore() + 1);
      this.spawnFood(); // respawn to maintain the count
    } else {
      this.snake.pop();
    }

    // AI SNAKES
    if (this.gameManager.getMode() === this.gameManager.Mode.PvE) {
      for (const ai of this.enemySnakes) {
        ai.direction = this.getAIDirection(ai);
        this.moveAISnake(ai);
      }
    }
  }

  draw() {
    // Clear canvas
    this.crc.fillStyle = 'black';
    this.crc.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

    // Draw snake
    for (let i = 0; i < this.snake.length; i++) {
      const segment = this.snake[i];
      const isHead = i === 0;

      // for example snake { x: 3, y: 2 } becomes { x: 60, y: 40 } pixels
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

      // scuffy stuff for the eyes 
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

    // food
    for (const f of this.food) {
      this.crc.fillStyle = 'red';
      this.crc.fillRect(
        f.x * this.tileSize,
        f.y * this.tileSize,
        this.tileSize,
        this.tileSize
      );
    }

    // draw enemy snakes
    for (const ai of this.enemySnakes) {
      for (let i = 0; i < ai.body.length; i++) {
        const segment = ai.body[i];
        const isHead = i === 0;

        const x = segment.x * this.tileSize;
        const y = segment.y * this.tileSize;

        const gradient = this.crc.createLinearGradient(x, y, x + this.tileSize, y + this.tileSize);

        if (isHead) {
          gradient.addColorStop(0, ai.color);
          gradient.addColorStop(1, '#ffaa00');
        } else {
          gradient.addColorStop(0, ai.color);
          gradient.addColorStop(1, '#663300'); 
        }

        this.crc.fillStyle = gradient;
        this.crc.fillRect(x, y, this.tileSize, this.tileSize);

        this.crc.lineWidth = 0.5;
        this.crc.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.crc.strokeRect(x + 0.25, y + 0.25, this.tileSize - 0.5, this.tileSize - 0.5);

        // draws an angry face on the enemies
        if (isHead) {
          const centerX = x + this.tileSize / 2;
          const centerY = y + this.tileSize / 2;
          const eyeOffsetX = this.tileSize * 0.15;
          const eyeOffsetY = this.tileSize * 0.2;
          const eyeRadius = this.tileSize * 0.07;

          this.crc.fillStyle = 'white';
          this.crc.strokeStyle = 'black';
          this.crc.lineWidth = 1.5;

          // Left eye
          this.crc.beginPath();
          this.crc.ellipse(centerX - eyeOffsetX, centerY - eyeOffsetY, eyeRadius * 1.5, eyeRadius, Math.PI / 6, 0, Math.PI * 2);
          this.crc.fill();
          this.crc.stroke();

          // Right eye
          this.crc.beginPath();
          this.crc.ellipse(centerX + eyeOffsetX, centerY - eyeOffsetY, eyeRadius * 1.5, eyeRadius, -Math.PI / 6, 0, Math.PI * 2);
          this.crc.fill();
          this.crc.stroke();

          // eyebrows (lines)
          this.crc.strokeStyle = 'black';
          this.crc.lineWidth = 2;

          // Left brow (angled down)
          this.crc.beginPath();
          this.crc.moveTo(centerX - eyeOffsetX - eyeRadius, centerY - eyeOffsetY - eyeRadius * 1.2);
          this.crc.lineTo(centerX - eyeOffsetX + eyeRadius, centerY - eyeOffsetY - eyeRadius * 0.5);
          this.crc.stroke();

          // Right brow (angled down)
          this.crc.beginPath();
          this.crc.moveTo(centerX + eyeOffsetX + eyeRadius, centerY - eyeOffsetY - eyeRadius * 1.2);
          this.crc.lineTo(centerX + eyeOffsetX - eyeRadius, centerY - eyeOffsetY - eyeRadius * 0.5);
          this.crc.stroke();

          // mouth (downward curve)
          this.crc.beginPath();
          this.crc.lineWidth = 2;
          this.crc.strokeStyle = 'black';
          const mouthWidth = this.tileSize * 0.3;
          const mouthHeight = this.tileSize * 0.15;
          this.crc.moveTo(centerX - mouthWidth / 2, centerY + mouthHeight / 2);
          this.crc.quadraticCurveTo(centerX, centerY + mouthHeight, centerX + mouthWidth / 2, centerY + mouthHeight / 2);
          this.crc.stroke();
        }
      }
    }
  }

  private spawnFood() {
    const isOccupied = (x: number, y: number): boolean => {
      const overlapsSnake = this.snake.some(segment => segment.x === x && segment.y === y);
      const overlapsEnemy = this.enemySnakes.some(ai =>
        ai.body.some(segment => segment.x === x && segment.y === y)
      );
      const overlapsFood = this.food.some(f => f.x === x && f.y === y);
      return overlapsSnake || overlapsEnemy || overlapsFood;
    };

    let x: number, y: number;
    do {
      x = Math.floor(Math.random() * this.cols);
      y = Math.floor(Math.random() * this.rows);
    } while (isOccupied(x, y));

    this.food.push({ x, y });
  }

  endGame() {
    clearInterval(this.intervalId);
    this.gameManager.setGameOver(true);

    this.gameManager.setTimePlayed(Date.now() - this.startTime);

    this.router.navigate(['/game-over']); 
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent) {
    const key = e.key.toLowerCase();

    // Pause toggle with P
    if (key === 'p') {
      this.togglePause();
      return;
    }

    // if paused, ignore movement input
    if (this.isPaused) return;

    const opposite: Record<Direction, Direction> = {
      [Direction.Up]: Direction.Down,
      [Direction.Down]: Direction.Up,
      [Direction.Left]: Direction.Right,
      [Direction.Right]: Direction.Left,
    };

    const keyToDirection: Record<string, Direction> = {
      arrowup: Direction.Up,
      w: Direction.Up,

      arrowdown: Direction.Down,
      s: Direction.Down,

      arrowleft: Direction.Left,
      a: Direction.Left,

      arrowright: Direction.Right,
      d: Direction.Right,
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

  private getAIDirection(ai: AISnake): Direction {
    const head = ai.body[0];
    const directions = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];

    // sometimes go towards food (50% rn)
    const goForFood = Math.random() < 0.5;
    if (goForFood && this.food.length > 0) {
      // Find closest food
      let closest = this.food[0];
      let minDist = this.distance(head, closest);
      for (const f of this.food) {
        const dist = this.distance(head, f);
        if (dist < minDist) {
          closest = f;
          minDist = dist;
        }
      }

      const dx = closest.x - head.x;
      const dy = closest.y - head.y;

      const preferred: Direction[] = [];
      if (Math.abs(dx) > Math.abs(dy)) {
        preferred.push(dx > 0 ? Direction.Right : Direction.Left);
        preferred.push(dy > 0 ? Direction.Down : Direction.Up);
      } else {
        preferred.push(dy > 0 ? Direction.Down : Direction.Up);
        preferred.push(dx > 0 ? Direction.Right : Direction.Left);
      }

      for (const dir of preferred) {
        if (this.isSafeDirection(ai, dir)) return dir;
      }
    }

    // otherwise pick a random safe direction
    const shuffled = directions.sort(() => Math.random() - 0.5);
    for (const dir of shuffled) {
      if (this.isSafeDirection(ai, dir)) return dir;
    }

    return ai.direction; // yolo
  }

  private isSafeDirection(ai: AISnake, direction: Direction): boolean {
    const head = ai.body[0];
    const next = { x: head.x, y: head.y };

    switch (direction) {
      case Direction.Up: next.y--; break;
      case Direction.Down: next.y++; break;
      case Direction.Left: next.x--; break;
      case Direction.Right: next.x++; break;
    }

    const wallHit = next.x < 0 || next.y < 0 || next.x >= this.cols || next.y >= this.rows;
    if (wallHit) return false;

    const bodyHit = ai.body.some(seg => seg.x === next.x && seg.y === next.y);
    if (bodyHit) return false;

    return true;
  }

  private moveAISnake(ai: AISnake) {
    const head = { ...ai.body[0] };

    switch (ai.direction) {
      case Direction.Up: head.y--; break;
      case Direction.Down: head.y++; break;
      case Direction.Left: head.x--; break;
      case Direction.Right: head.x++; break;
    }

    if (
      head.x < 0 || head.y < 0 ||
      head.x >= this.cols || head.y >= this.rows ||
      ai.body.some(seg => seg.x === head.x && seg.y === head.y) ||
      this.snake.some(seg => seg.x === head.x && seg.y === head.y)
    ) {
      // kill the snake by removing it
      this.enemySnakes = this.enemySnakes.filter(s => s !== ai);

        // 🆕 respawn if Endless style
      if (this.gameManager.getStyle() === this.gameManager.Style.Endless) {
        this.spawnEnemySnake();
      }
      return;
    }

    ai.body.unshift(head);

    // eats food
    const foodIndex = this.food.findIndex(f => f.x === head.x && f.y === head.y);

    if (foodIndex !== -1) {
      this.food.splice(foodIndex, 1); // remove eaten food
      this.spawnFood();
    } else {
      ai.body.pop();
    }
  }

}
