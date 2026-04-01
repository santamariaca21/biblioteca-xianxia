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
      <div></div>
    </header>
  `,
  styles: [`
    .site-header {
      background: var(--t-card, #0f1218);
      border-bottom: 1px solid var(--t-border, rgba(201,168,76,0.25));
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      height: 56px;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      transform: translateZ(0);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      letter-spacing: 0.25em;
      color: var(--t-gold-dim, #7a6330);
      text-transform: uppercase;
      text-decoration: none;
      justify-self: start;
      .highlight { color: var(--t-gold, #c9a84c); }
    }
    .header-title {
      font-family: 'Cinzel', serif;
      font-size: 0.85rem;
      color: var(--t-dim, #8a8070);
      letter-spacing: 0.1em;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 0.5rem;
    }
    .settings-toggle {
      background: none;
      border: 1px solid var(--t-border, rgba(201,168,76,0.25));
      color: var(--t-gold, #c9a84c);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 4px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      justify-self: end;
      &:hover { background: rgba(201,168,76,0.08); }
    }
  `],
})
export class HeaderComponent {
  title = input('');
  settingsClick = output();
}
