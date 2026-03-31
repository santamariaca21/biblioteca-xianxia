import { Component, inject, input } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (!inline()) {
      <div class="panel-overlay" (click)="close()"></div>
    }
    <div class="settings-panel" [class.inline-mode]="inline()">
      @if (!inline()) {
        <div class="panel-header">
          <span>Ajustes de Lectura</span>
          <button (click)="close()"><app-icon name="x" [size]="16" /></button>
        </div>
      }
      @if (inline()) {
        <div class="inline-header">Ajustes</div>
      }

      <div class="setting-group">
        <label>Idioma / Language</label>
        <div class="lang-options">
          <button class="lang-btn" [class.active]="settings.settings().language === 'es'" (click)="settings.update({ language: 'es' })">
            <span class="lang-flag">ES</span> Español
          </button>
          <button class="lang-btn" [class.active]="settings.settings().language === 'en'" (click)="settings.update({ language: 'en' })">
            <span class="lang-flag">EN</span> English
          </button>
        </div>
      </div>

      <div class="setting-group">
        <label>Tamaño de letra</label>
        <div class="font-controls">
          <button (click)="changeFontSize(-1)">A-</button>
          <span class="font-size-display">{{ settings.settings().fontSize }}px</span>
          <button (click)="changeFontSize(1)">A+</button>
        </div>
      </div>

      <div class="setting-group">
        <label>Interlineado</label>
        <div class="font-controls">
          <button (click)="changeLineHeight(-0.1)">-</button>
          <span class="font-size-display">{{ (settings.settings().lineHeight ?? 1.9).toFixed(1) }}</span>
          <button (click)="changeLineHeight(0.1)">+</button>
        </div>
      </div>

      <div class="setting-group">
        <label>Color de fondo</label>
        <div class="bg-options">
          @for (opt of settings.bgOptions; track opt.value) {
            <button
              class="bg-swatch"
              [class.active]="settings.settings().bgColor === opt.value"
              [style.background]="opt.value"
              [style.color]="isLight(opt.value) ? '#333' : '#ddd'"
              (click)="settings.update({ bgColor: opt.value })"
            >{{ opt.label }}</button>
          }
        </div>
      </div>

      <div class="setting-group" style="display:none">
        <div class="toggle-row">
          <button class="toggle-btn"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .panel-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 200;
    }
    .settings-panel {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 320px; max-width: 90vw;
      background: var(--t-card, #13161e);
      border-left: 1px solid var(--t-border, #1e2230);
      z-index: 201;
      padding: 1.5rem;
      overflow-y: auto;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .panel-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem;
      font-family: 'Cinzel', serif;
      font-size: 0.85rem;
      color: var(--t-gold, #c9a84c);
      letter-spacing: 0.1em;
      button {
        background: none; border: none; color: var(--t-dim, #8a8070);
        font-size: 1.2rem; cursor: pointer;
        &:hover { color: var(--t-gold, #c9a84c); }
      }
    }
    .setting-group {
      margin-bottom: 1.5rem;
      label {
        display: block;
        font-size: 0.7rem;
        color: var(--t-gold-dim, #7a6330);
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-bottom: 0.75rem;
        font-family: 'Cinzel', serif;
      }
    }
    .lang-options {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
    }
    .lang-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.6rem 0.8rem; border-radius: 6px;
      border: 2px solid var(--t-border, #1e2230);
      background: var(--t-hover, #1a1f2a);
      color: var(--t-dim, #8a8070); font-size: 0.75rem; cursor: pointer;
      font-family: 'EB Garamond', serif; transition: all 0.2s;
      &.active {
        border-color: var(--t-gold, #c9a84c);
        color: var(--t-text, #e8e0d0);
        background: var(--t-sys-bg, rgba(201,168,76,0.08));
      }
      &:hover { border-color: var(--t-gold-dim, rgba(201,168,76,0.25)); }
      .lang-flag {
        font-family: 'Cinzel', serif; font-weight: 700;
        font-size: 0.65rem; letter-spacing: 0.05em;
        padding: 0.15rem 0.35rem; border-radius: 3px;
        background: var(--t-sys-bg, rgba(201,168,76,0.15));
        color: var(--t-gold, #c9a84c);
      }
    }
    .font-controls {
      display: flex; align-items: center; gap: 1rem;
      button {
        background: var(--t-hover, #1a1f2a);
        border: 1px solid var(--t-border, #1e2230);
        color: var(--t-text, #e8e0d0);
        padding: 0.5rem 1rem; border-radius: 4px;
        cursor: pointer; font-size: 0.9rem;
        &:hover { border-color: var(--t-gold-dim, rgba(201,168,76,0.25)); }
      }
      .font-size-display {
        color: var(--t-gold, #c9a84c); font-family: 'Cinzel', serif;
        font-size: 0.85rem; min-width: 40px; text-align: center;
      }
    }
    .bg-options {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.3rem;
      .bg-swatch {
        padding: 0.35rem 0.2rem; border-radius: 4px;
        border: 2px solid transparent;
        font-size: 0.55rem; cursor: pointer;
        transition: all 0.2s;
        &.active { border-color: var(--t-gold, #c9a84c); }
        &:hover { opacity: 0.8; }
      }
    }
    .toggle-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0;
      span { color: var(--t-dim, #8a8070); font-size: 0.85rem; }
    }
    .toggle-btn {
      background: var(--t-hover, #1a1f2a);
      border: 1px solid var(--t-border, #1e2230);
      color: var(--t-dim, #8a8070);
      padding: 0.35rem 0.8rem; border-radius: 4px;
      cursor: pointer; font-size: 0.75rem;
      transition: all 0.2s;
      &.on { border-color: var(--t-teal, rgba(42,127,127,0.4)); color: var(--t-teal, #4ecdc4); }
      &:hover { border-color: rgba(201,168,76,0.25); }
    }
  `],
})
export class SettingsPanelComponent {
  settings = inject(SettingsService);
  inline = input(false);
  private static closeCallback: (() => void) | null = null;

  static onClose(fn: () => void) { this.closeCallback = fn; }

  close() {
    SettingsPanelComponent.closeCallback?.();
  }

  changeFontSize(delta: number) {
    const current = this.settings.settings().fontSize;
    const next = Math.max(12, Math.min(28, current + delta));
    this.settings.update({ fontSize: next });
  }

  changeLineHeight(delta: number) {
    const current = this.settings.settings().lineHeight ?? 1.95;
    const next = Math.max(1.2, Math.min(3.0, Math.round((current + delta) * 10) / 10));
    this.settings.update({ lineHeight: next });
  }

  isLight(color: string): boolean {
    return ['#f4ecd8', '#f5f5f5', '#e8dcc8', '#f0ead6', '#ffffff'].includes(color);
  }
}
