import { Component, input, output, effect, signal, computed, ElementRef, inject } from '@angular/core';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-chapter-sidebar',
  standalone: true,
  imports: [IconComponent],
  template: `
    <aside class="sidebar-left" [class.open]="mobileOpen()">
      <div class="sidebar-header">
        <div class="sidebar-section-title">Índice</div>
        <span class="chapter-count">{{ chapters().length }} caps</span>
      </div>

      <!-- Search + Go to chapter -->
      <div class="search-bar">
        <app-icon name="eye" [size]="13" />
        <input
          type="text"
          [placeholder]="'Buscar o ir al cap...'"
          [value]="searchQuery()"
          (input)="onSearch($event)"
          (keydown.enter)="onGoToChapter()"
        />
        @if (searchQuery()) {
          <button class="clear-btn" (click)="clearSearch()">
            <app-icon name="x" [size]="12" />
          </button>
        }
      </div>

      <!-- Current chapter indicator -->
      @if (activeChapter() !== 'portada' && activeChapterNumber() > 0) {
        <div class="current-indicator" (click)="scrollToActive()">
          <app-icon name="map-pin" [size]="12" />
          <span>Cap. {{ activeChapterNumber() }}</span>
          <span class="go-current">ir</span>
        </div>
      }

      <!-- Range selector -->
      @if (!searchQuery() && chapters().length > 0) {
        <div class="range-selector">
          @for (range of ranges(); track range.label) {
            <button
              class="range-btn"
              [class.active]="effectiveRange() === range.label"
              (click)="selectRange(range)"
            >{{ range.label }}</button>
          }
        </div>
      }

      <!-- Chapter list -->
      <nav class="chapter-list">
        @for (ch of visibleChapters(); track ch.id) {
          <div
            class="chapter-item"
            [class.active]="activeChapter() === ch.id"
            [attr.data-chapter]="ch.id"
            (click)="chapterSelected.emit(ch.id)"
          >
            <span class="chapter-num">{{ ch.number }}</span>
            <span class="chapter-title-nav">{{ ch.title }}</span>
          </div>
        }

        @if (visibleChapters().length === 0 && searchQuery()) {
          <div class="no-results">Sin resultados para "{{ searchQuery() }}"</div>
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar-left {
      border-right: 1px solid var(--t-border, #1e2230);
      padding: 0;
      position: sticky;
      top: 56px;
      height: calc(100vh - 56px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      &::-webkit-scrollbar { width: 3px; }
      &::-webkit-scrollbar-thumb { background: var(--t-sys-border, rgba(201,168,76,0.25)); border-radius: 2px; }
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1rem 0.5rem;
    }
    .sidebar-section-title {
      font-family: 'Cinzel', serif;
      font-size: 0.6rem;
      letter-spacing: 0.3em;
      color: var(--t-gold-dim, #7a6330);
      text-transform: uppercase;
    }
    .chapter-count {
      font-size: 0.6rem;
      color: var(--t-dim, #666);
      font-family: 'Cinzel', serif;
    }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0.4rem 0.8rem;
      padding: 0.45rem 0.6rem;
      background: var(--t-hover, rgba(255,255,255,0.04));
      border: 1px solid var(--t-border, #1e2230);
      border-radius: 6px;
      color: var(--t-dim, #8a8070);
      input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: var(--t-text, #e8e0d0);
        font-size: 0.78rem;
        font-family: 'EB Garamond', serif;
        &::placeholder { color: var(--t-dim, #666); }
      }
      .clear-btn {
        background: none; border: none; color: var(--t-dim, #666);
        cursor: pointer; padding: 2px; display: flex;
        &:hover { color: var(--t-text, #e8e0d0); }
      }
    }
    .current-indicator {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 1rem;
      margin: 0.2rem 0.8rem;
      font-size: 0.7rem;
      color: var(--t-gold, #c9a84c);
      background: var(--t-sys-bg, rgba(201,168,76,0.06));
      border-radius: 4px;
      cursor: pointer;
      font-family: 'Cinzel', serif;
      letter-spacing: 0.05em;
      .go-current {
        margin-left: auto;
        font-size: 0.6rem;
        color: var(--t-dim, #666);
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      &:hover { background: var(--t-sys-bg, rgba(201,168,76,0.1)); }
    }
    .range-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.2rem;
      padding: 0.4rem 0.6rem;
      border-bottom: 1px solid var(--t-border, #1e2230);
      max-height: 120px;
      overflow-y: auto;
      &::-webkit-scrollbar { width: 2px; }
      &::-webkit-scrollbar-thumb { background: var(--t-border, #1e2230); }
    }
    .range-btn {
      background: var(--t-hover, rgba(255,255,255,0.03));
      border: 1px solid var(--t-border, #1e2230);
      color: var(--t-dim, #8a8070);
      font-size: 0.55rem;
      padding: 0.2rem 0.3rem;
      border-radius: 3px;
      cursor: pointer;
      font-family: 'Cinzel', serif;
      text-align: center;
      transition: all 0.15s;
      &:hover { border-color: var(--t-gold-dim, #7a6330); color: var(--t-text, #e8e0d0); }
      &.active {
        background: var(--t-sys-bg, rgba(201,168,76,0.1));
        border-color: var(--t-gold, #c9a84c);
        color: var(--t-gold, #c9a84c);
      }
    }
    .chapter-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0;
      &::-webkit-scrollbar { width: 3px; }
      &::-webkit-scrollbar-thumb { background: var(--t-sys-border, rgba(201,168,76,0.25)); border-radius: 2px; }
    }
    .chapter-item {
      display: flex; align-items: baseline; gap: 0.5rem;
      padding: 0.35rem 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
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
      font-size: 0.55rem;
      color: var(--t-gold, #c9a84c);
      min-width: 26px;
      text-align: right;
      flex-shrink: 0;
    }
    .chapter-title-nav {
      font-size: 0.72rem;
      color: var(--t-dim, #8a8070);
      line-height: 1.25;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .no-results {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--t-dim, #666);
      font-size: 0.8rem;
      font-style: italic;
    }
    @media (max-width: 900px) {
      .sidebar-left {
        display: none;
        &.open {
          display: flex;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 300px;
          max-width: 85vw;
          background: var(--t-card, #0f1218);
          z-index: 200;
          box-shadow: 4px 0 20px rgba(0,0,0,0.3);
          animation: slideInLeft 0.25s ease;
          height: 100vh;
          padding-top: 0.5rem;
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
  private el = inject(ElementRef);
  chapters = input<{ id: string; number: number; title: string }[]>([]);
  activeChapter = input('portada');
  mobileOpen = input(false);
  chapterSelected = output<string>();

  searchQuery = signal('');
  activeRange = signal('');

  private RANGE_SIZE = 200;

  activeChapterNumber = computed(() => {
    const id = this.activeChapter();
    const ch = this.chapters().find(c => c.id === id);
    return ch?.number ?? 0;
  });

  ranges = computed(() => {
    const total = this.chapters().length;
    if (total <= this.RANGE_SIZE) return [];
    const result: { label: string; start: number; end: number }[] = [];
    for (let i = 0; i < total; i += this.RANGE_SIZE) {
      const start = i + 1;
      const end = Math.min(i + this.RANGE_SIZE, total);
      result.push({ label: `${start}-${end}`, start, end });
    }
    return result;
  });

  private defaultRange = computed(() => {
    const activeNum = this.activeChapterNumber();
    const rangeStart = activeNum > 0
      ? Math.floor((activeNum - 1) / this.RANGE_SIZE) * this.RANGE_SIZE
      : 0;
    const match = this.ranges().find(r => r.start === rangeStart + 1);
    return match?.label ?? this.ranges()[0]?.label ?? '';
  });

  visibleChapters = computed(() => {
    const all = this.chapters();
    if (all.length === 0) return [];

    const query = this.searchQuery().trim().toLowerCase();
    const range = this.activeRange() || this.defaultRange();

    // Search mode
    if (query) {
      return all.filter(ch =>
        ch.number.toString().includes(query) || ch.title.toLowerCase().includes(query)
      ).slice(0, 50);
    }

    // Range mode
    if (range) {
      const r = this.ranges().find(r => r.label === range);
      if (r) return all.slice(r.start - 1, r.end);
    }

    // Fallback: first chunk
    return all.slice(0, Math.min(this.RANGE_SIZE, all.length));
  });

  effectiveRange = computed(() => this.activeRange() || this.defaultRange());

  constructor() {
    effect(() => {
      const active = this.activeChapter();
      const chapters = this.chapters();
      if (active && chapters.length > 0) {
        setTimeout(() => {
          const listEl = this.el.nativeElement.querySelector('.chapter-list');
          const activeEl = this.el.nativeElement.querySelector('.chapter-item.active');
          if (listEl && activeEl) {
            const listRect = listEl.getBoundingClientRect();
            const activeRect = activeEl.getBoundingClientRect();
            const offset = activeRect.top - listRect.top + listEl.scrollTop - (listRect.height / 2);
            listEl.scrollTop = Math.max(0, offset);
          }
        }, 150);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    if (value) this.activeRange.set('');
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  onGoToChapter() {
    const query = this.searchQuery().trim();
    const num = parseInt(query);
    if (!isNaN(num)) {
      const ch = this.chapters().find(c => c.number === num);
      if (ch) {
        this.chapterSelected.emit(ch.id);
        this.clearSearch();
      }
    }
  }

  selectRange(range: { label: string; start: number; end: number }) {
    this.activeRange.set(range.label);
    this.searchQuery.set('');
  }

  scrollToActive() {
    const activeNum = this.activeChapterNumber();
    if (activeNum > 0) {
      const rangeStart = Math.floor((activeNum - 1) / this.RANGE_SIZE) * this.RANGE_SIZE + 1;
      const rangeEnd = Math.min(rangeStart + this.RANGE_SIZE - 1, this.chapters().length);
      const matchRange = this.ranges().find(r => r.start === rangeStart);
      if (matchRange) {
        this.activeRange.set(matchRange.label);
      }
      this.searchQuery.set('');
    }
  }
}
