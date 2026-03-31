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
  // ── DARK THEMES ──
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
  '#0d1117': {
    bg: '#0d1117', textMain: '#c9d1d9', textDim: '#8b949e', textFaint: '#21262d',
    border: '#21262d', card: '#161b22', hover: '#1c2128',
    gold: '#d2a028', goldLight: '#e8b84a', goldDim: '#8a7020',
    teal: '#3fb950', red: '#f85149',
    dialogue: '#b8c0c8', systemBg: 'rgba(210,160,40,0.08)', systemBorder: 'rgba(210,160,40,0.2)',
  },
  '#1e1e1e': {
    bg: '#1e1e1e', textMain: '#d4d4d4', textDim: '#808080', textFaint: '#333333',
    border: '#333333', card: '#252526', hover: '#2d2d30',
    gold: '#dca84a', goldLight: '#f0c060', goldDim: '#8a7030',
    teal: '#4ec9b0', red: '#f44747',
    dialogue: '#c8c0b0', systemBg: 'rgba(220,168,74,0.08)', systemBorder: 'rgba(220,168,74,0.2)',
  },
  '#2b2b2b': {
    bg: '#2b2b2b', textMain: '#e0dcd0', textDim: '#999088', textFaint: '#444040',
    border: '#3a3838', card: '#333030', hover: '#3e3a3a',
    gold: '#c9a84c', goldLight: '#e0c068', goldDim: '#8a7030',
    teal: '#5ac8b8', red: '#e86060',
    dialogue: '#d0c8b8', systemBg: 'rgba(201,168,76,0.1)', systemBorder: 'rgba(201,168,76,0.25)',
  },
  // ── LIGHT THEMES ──
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
  '#f0ead6': {
    bg: '#f0ead6', textMain: '#2c2416', textDim: '#6a5c48', textFaint: '#d0c4a8',
    border: '#d4c8a8', card: '#e8e0cc', hover: '#e0d8c0',
    gold: '#8a6a18', goldLight: '#a07a20', goldDim: '#b09050',
    teal: '#1a7060', red: '#a82820',
    dialogue: '#3e3428', systemBg: 'rgba(138,106,24,0.07)', systemBorder: 'rgba(138,106,24,0.2)',
  },
  '#ffffff': {
    bg: '#ffffff', textMain: '#1a1a1a', textDim: '#555555', textFaint: '#dddddd',
    border: '#e8e8e8', card: '#f8f8f8', hover: '#f0f0f0',
    gold: '#6a4a08', goldLight: '#7a5a10', goldDim: '#9a8040',
    teal: '#146a60', red: '#c02020',
    dialogue: '#333333', systemBg: 'rgba(106,74,8,0.05)', systemBorder: 'rgba(106,74,8,0.15)',
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
    return { fontSize: 18, lineHeight: 1.9, bgColor: '#0a0c10', showTalents: true, showStats: true, language: 'es' as SupportedLanguage };
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
    { label: 'Abismo', value: '#0a0c10' },
    { label: 'Noche', value: '#1a1a2e' },
    { label: 'GitHub', value: '#0d1117' },
    { label: 'Carbón', value: '#1e1e1e' },
    { label: 'Grafito', value: '#2b2b2b' },
    { label: 'Sepia', value: '#f4ecd8' },
    { label: 'Pergamino', value: '#e8dcc8' },
    { label: 'Crema', value: '#f0ead6' },
    { label: 'Papel', value: '#f5f5f5' },
    { label: 'Blanco', value: '#ffffff' },
  ];

  isLight(): boolean {
    return ['#f4ecd8', '#f5f5f5', '#e8dcc8', '#f0ead6', '#ffffff'].includes(this.settings().bgColor);
  }
}
