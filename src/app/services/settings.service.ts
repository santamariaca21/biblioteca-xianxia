import { Injectable, signal } from '@angular/core';
import { ReaderSettings, SupportedLanguage } from '../models/novel.model';

export interface ThemeColors {
  bg: string;
  textMain: string;
  textDim: string;
  textFaint: string;
  border: string;
  card: string;
  hover: string;
  gold: string;
  goldLight: string;
  goldDim: string;
  teal: string;
  red: string;
  dialogue: string;
  systemBg: string;
  systemBorder: string;
}

const THEMES: Record<string, ThemeColors> = {
  '#0a0c10': {
    bg: '#0a0c10', textMain: '#e8e0d0', textDim: '#8a8070', textFaint: '#3a3830',
    border: '#1e2230', card: '#13161e', hover: '#1a1f2a',
    gold: '#c9a84c', goldLight: '#e8c97a', goldDim: '#7a6330',
    teal: '#4ecdc4', red: '#e06070',
    dialogue: '#ddd0b8', systemBg: 'rgba(201,168,76,0.08)', systemBorder: 'rgba(201,168,76,0.25)',
  },
  '#1a1a2e': {
    bg: '#1a1a2e', textMain: '#e0dcd0', textDim: '#908878', textFaint: '#3a3848',
    border: '#2a2840', card: '#22203a', hover: '#2e2c48',
    gold: '#d4a843', goldLight: '#ecc96e', goldDim: '#8a6e2a',
    teal: '#50d0c0', red: '#e86878',
    dialogue: '#d8ccb8', systemBg: 'rgba(212,168,67,0.1)', systemBorder: 'rgba(212,168,67,0.3)',
  },
  '#f4ecd8': {
    bg: '#f4ecd8', textMain: '#3a3228', textDim: '#6e6050', textFaint: '#c8bea8',
    border: '#d8ccb0', card: '#ece4d0', hover: '#e8ddc4',
    gold: '#8b6914', goldLight: '#a07818', goldDim: '#b09050',
    teal: '#1a7a6e', red: '#b83030',
    dialogue: '#504838', systemBg: 'rgba(139,105,20,0.08)', systemBorder: 'rgba(139,105,20,0.25)',
  },
  '#f5f5f5': {
    bg: '#f5f5f5', textMain: '#2a2a2a', textDim: '#666660', textFaint: '#cccccc',
    border: '#ddddd8', card: '#eaeae8', hover: '#e0e0dc',
    gold: '#7a5a10', goldLight: '#8b6914', goldDim: '#a08840',
    teal: '#187068', red: '#c03030',
    dialogue: '#444440', systemBg: 'rgba(122,90,16,0.06)', systemBorder: 'rgba(122,90,16,0.2)',
  },
  '#e8dcc8': {
    bg: '#e8dcc8', textMain: '#36302a', textDim: '#6a5e50', textFaint: '#c0b4a0',
    border: '#d0c4ae', card: '#dfd3be', hover: '#d6c8b0',
    gold: '#7a5510', goldLight: '#906818', goldDim: '#a88c50',
    teal: '#1a756a', red: '#a83028',
    dialogue: '#4a4038', systemBg: 'rgba(122,85,16,0.08)', systemBorder: 'rgba(122,85,16,0.22)',
  },
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly STORAGE_KEY = 'bx-reader-settings';

  settings = signal<ReaderSettings>(this.loadSettings());

  private loadSettings(): ReaderSettings {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { fontSize: 18, bgColor: '#0a0c10', showTalents: true, showStats: true, language: 'es' as SupportedLanguage };
  }

  update(partial: Partial<ReaderSettings>) {
    const current = this.settings();
    const updated = { ...current, ...partial };
    this.settings.set(updated);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  getTheme(): ThemeColors {
    return THEMES[this.settings().bgColor] ?? THEMES['#0a0c10'];
  }

  readonly bgOptions = [
    { label: 'Oscuro', value: '#0a0c10' },
    { label: 'Noche', value: '#1a1a2e' },
    { label: 'Sepia', value: '#f4ecd8' },
    { label: 'Claro', value: '#f5f5f5' },
    { label: 'Pergamino', value: '#e8dcc8' },
  ];

  isLight(): boolean {
    return ['#f4ecd8', '#f5f5f5', '#e8dcc8'].includes(this.settings().bgColor);
  }
}
