import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <header class="site-header">
      <a routerLink="/" class="logo">
        <app-icon name="book-open" [size]="16" color="var(--t-gold, #c9a84c)" />
        <span class="logo-text"><span class="highlight">Biblioteca</span> Xianxia</span>
      </a>
      <div class="header-title">{{ title() }}</div>
      <button class="settings-toggle" (click)="settingsClick.emit()">
        <app-icon name="settings" [size]="16" />
      </button>
    </header>
  `,
  styles: [`
    .site-header {
      background: #060709;
      border-bottom: 1px solid rgba(201,168,76,0.25);
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
      height: 56px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      color: #7a6330;
      text-transform: uppercase;
      text-decoration: none;
      .highlight { color: #c9a84c; }
    }
    .header-title {
      font-family: 'Cinzel', serif;
      font-size: 0.85rem;
      color: #8a8070;
      letter-spacing: 0.1em;
    }
    .settings-toggle {
      background: none;
      border: 1px solid rgba(201,168,76,0.25);
      color: #c9a84c;
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 4px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { background: rgba(201,168,76,0.08); }
    }
  `],
})
export class HeaderComponent {
  title = input('');
  settingsClick = output();
}
