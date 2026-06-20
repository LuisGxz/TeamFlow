import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/boards' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'invite',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/accept-invite.component').then((m) => m.AcceptInviteComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'boards' },
      {
        path: 'boards',
        loadComponent: () => import('./features/boards/boards-list.component').then((m) => m.BoardsListComponent),
      },
      {
        path: 'boards/:boardId',
        loadComponent: () => import('./features/board/board-view.component').then((m) => m.BoardViewComponent),
      },
      {
        path: 'members',
        loadComponent: () => import('./features/members/members.component').then((m) => m.MembersComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'app/boards' },
];
