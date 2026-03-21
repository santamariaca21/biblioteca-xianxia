import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/library/library').then(m => m.LibraryComponent),
  },
  {
    path: 'novel/:novelId',
    loadComponent: () => import('./pages/reader/reader').then(m => m.ReaderComponent),
  },
  {
    path: 'novel/:novelId/personajes',
    loadComponent: () => import('./pages/characters/characters').then(m => m.CharactersComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
