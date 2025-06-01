import { Routes } from '@angular/router';
import { MenuComponent } from './game/menu/menu.component';
import { PlayComponent } from './game/play/play.component';
import { OverComponent } from './game/over/over.component';

export const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'play', component: PlayComponent },
  { path: 'game-over', component: OverComponent },
  { path: '**', redirectTo: '' },
];