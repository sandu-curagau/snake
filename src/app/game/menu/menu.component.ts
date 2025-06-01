import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GameManagerService } from '../shared/game-manager.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(public gameManager: GameManagerService) {

  }
}
