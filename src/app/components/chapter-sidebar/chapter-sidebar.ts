import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-chapter-sidebar',
  standalone: true,
  template: `
    <aside class="sidebar-left" [class.open]="mobileOpen()">
      <div class="sidebar-section-title">Índice</div>
      <nav class="chapter-list">
        <div
          class="chapter-item"
          [class.active]="activeChapter() === 'portada'"
          (click)="chapterSelected.emit('portada')"
        >
          <span class="chapter-num">~</span>
          <span class="chapter-title-nav">Portada</span>
        </div>
        @for (ch of chapters(); track ch.id) {
          <div
            class="chapter-item"
            [class.active]="activeChapter() === ch.id"
            (click)="chapterSelected.emit(ch.id)"
          >
            <span class="chapter-num">Cap. {{ ch.number }}</span>
            <span class="chapter-title-nav">{{ ch.title }}</span>
          </div>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar-left {
      border-right: 1px solid var(--t-border, #1e2230);
      padding: 1.5rem 0;
      position: sticky;
      top: 56px;
      height: calc(100vh - 56px);
      overflow-y: auto;
      &::-webkit-scrollbar { width: 3px; }
      &::-webkit-scrollbar-thumb { background: var(--t-sys-border, rgba(201,168,76,0.25)); border-radius: 2px; }
    }
    .sidebar-section-title {
      font-family: 'Cinzel', serif;
      font-size: 0.6rem;
      letter-spacing: 0.3em;
      color: var(--t-gold-dim, #7a6330);
      text-transform: uppercase;
      padding: 0 1.5rem 1rem;
      border-bottom: 1px solid var(--t-border, #1e2230);
      margin-bottom: 1rem;
    }
    .chapter-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.8rem 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 2px solid transparent;
      &:hover {
        background: var(--t-hover, #1a1f2a);
        border-left-color: var(--t-gold-dim, #7a6330);
      }
      &.active {
        background: var(--t-sys-bg, rgba(201,168,76,0.08));
        border-left-color: var(--t-gold, #c9a84c);
        .chapter-title-nav { color: var(--t-text, #e8e0d0); }
      }
    }
    .chapter-num {
      font-family: 'Cinzel', serif;
      font-size: 0.65rem;
      color: var(--t-gold, #c9a84c);
      min-width: 50px;
    }
    .chapter-title-nav {
      font-size: 0.85rem;
      color: var(--t-dim, #8a8070);
      line-height: 1.3;
    }
    @media (max-width: 900px) {
      .sidebar-left {
        display: none;
        &.open {
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 300px;
          max-width: 85vw;
          background: var(--t-card, #0f1218);
          z-index: 200;
          box-shadow: 4px 0 20px rgba(0,0,0,0.3);
          animation: slideInLeft 0.25s ease;
          height: 100vh;
          overflow-y: auto;
          padding-top: 1rem;
        }
      }
      @keyframes slideInLeft {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
      }
    }
  `],
})
export class ChapterSidebarComponent {
  chapters = input<{ id: string; number: number; title: string }[]>([]);
  activeChapter = input('portada');
  mobileOpen = input(false);
  chapterSelected = output<string>();
}
