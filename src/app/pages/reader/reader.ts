import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgStyle } from '@angular/common';
import { NovelService } from '../../services/novel.service';
import { SettingsService } from '../../services/settings.service';
import { Novel, Chapter, ChapterIndexEntry, resolveLocalized } from '../../models/novel.model';
import { HeaderComponent } from '../../components/header/header';
import { ChapterSidebarComponent } from '../../components/chapter-sidebar/chapter-sidebar';
import { SettingsPanelComponent } from '../../components/settings-panel/settings-panel';
import { IconComponent } from '../../components/icon/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [
    NgStyle,
    HeaderComponent,
    ChapterSidebarComponent,
    SettingsPanelComponent,
    IconComponent,
  ],
  template: `
    <app-header [title]="novel()?.title ?? ''" (settingsClick)="showSettings.set(!showSettings())" />

    <!-- Mobile nav bar -->
    <div class="mobile-nav">
      <button class="mobile-btn" (click)="mobileSidebar.set(!mobileSidebar())"><app-icon name="menu" [size]="14" /> Índice</button>
      <span class="mobile-chapter-label">{{ chapterTitle() || 'Portada' }}</span>
      <button class="mobile-btn" (click)="showSettings.set(true)"><app-icon name="settings" [size]="14" /></button>
    </div>

    @if (mobileSidebar()) {
      <div class="mobile-overlay" (click)="mobileSidebar.set(false)"></div>
    }

    <div class="app-layout" [ngStyle]="themeVars()">
      <app-chapter-sidebar
        [chapters]="chapterIndex()"
        [activeChapter]="activeChapterId()"
        [mobileOpen]="mobileSidebar()"
        (chapterSelected)="onChapterSelected($event)"
      />

      <main class="main-content" [style.font-size.px]="settings.settings().fontSize" [style.line-height]="settings.settings().lineHeight ?? 1.9">
        <!-- PORTADA -->
        @if (activeChapterId() === 'portada') {
          <div class="novel-hero">
            <div class="novel-badge">{{ novel()?.genre }}</div>
            <h1 class="novel-title-main">{{ novel()?.title }}</h1>
            <p class="novel-title-sub">{{ novel()?.titleChinese }}</p>
            <div class="novel-divider">◆</div>
            <p class="novel-description">{{ novel()?.description }}</p>
            <div class="hero-actions">
              <button class="nav-btn" (click)="onChapterSelected(chapterIndex()[0]?.id ?? 'cap1')"><app-icon name="book-open" [size]="14" /> Comenzar a Leer</button>
            </div>

            <div class="chapter-section">
              <div class="section-header">
                <div class="section-icon"><app-icon name="swords" [size]="16" /></div>
                <div class="section-title">Reinos de Cultivo</div>
              </div>
              <ul class="realm-list">
                @for (realm of novel()?.realms; track realm.name) {
                  <li class="realm-item" [class.current]="realm.current">{{ realm.name }}</li>
                }
              </ul>
            </div>
          </div>
        }

        <!-- CHAPTER CONTENT -->
        @if (currentChapter(); as ch) {
          <div class="chapter-view">
            <div class="chapter-header">
              <div class="chapter-label">Capítulo {{ ch.number }}</div>
              <h2 class="chapter-title-main">{{ chapterTitle() }}</h2>
            </div>

            <div class="prose" [innerHTML]="sanitizedContent()"></div>

            <div class="ornament">―――</div>

            <!-- CHAPTER NAVIGATION -->
            <div class="chapter-nav">
              <button class="nav-btn" [disabled]="!prevChapterId()" (click)="onChapterSelected(prevChapterId()!)"><app-icon name="chevron-left" [size]="14" /> Anterior</button>
              <span class="nav-indicator">CAP. {{ ch.number }} / {{ chapterIndex().length }}</span>
              <button class="nav-btn next" [disabled]="!nextChapterId()" (click)="onChapterSelected(nextChapterId()!)">Siguiente <app-icon name="chevron-right" [size]="14" /></button>
            </div>
          </div>
        }
      </main>

      <div class="settings-column">
        <app-settings-panel [inline]="true" />
      </div>
    </div>

    <button class="scroll-top" [class.visible]="showScrollTop()" (click)="scrollToTop()"><app-icon name="chevron-up" [size]="18" /></button>
  `,
  styleUrl: './reader.scss',
})
export class ReaderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private novelService = inject(NovelService);
  private sanitizer = inject(DomSanitizer);
  settings = inject(SettingsService);
  private scrollTimer: any = null;
  private scrollHandler = () => this.onScroll();

  novelId = '';
  novel = signal<Novel | null>(null);
  chapters = signal<Map<string, Chapter>>(new Map());
  chaptersIdx = signal<ChapterIndexEntry[]>([]);
  activeChapterId = signal('portada');
  showSettings = signal(false);
  mobileSidebar = signal(false);
  showScrollTop = signal(false);

  lang = computed(() => this.settings.settings().language);

  chapterIndex = computed(() => {
    const idx = this.chaptersIdx();
    const l = this.lang();
    return idx.map(entry => ({
      id: entry.id,
      number: entry.n,
      title: (l === 'en' ? entry.en : entry.es) || entry.es || entry.en || `Cap ${entry.n}`,
    }));
  });

  currentChapter = computed(() => {
    const id = this.activeChapterId();
    if (id === 'portada') return null;
    return this.chapters().get(id) ?? null;
  });

  chapterTitle = computed(() => {
    const ch = this.currentChapter();
    if (!ch) return '';
    return resolveLocalized(ch.title, this.lang());
  });

  sanitizedContent = computed(() => {
    const ch = this.currentChapter();
    if (!ch) return '';
    const raw = resolveLocalized(ch.content, this.lang());
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  prevChapterId = computed(() => {
    const idx = this.chapterIndex();
    const currentIdx = idx.findIndex(c => c.id === this.activeChapterId());
    if (currentIdx <= 0) return null;
    return idx[currentIdx - 1].id;
  });

  nextChapterId = computed(() => {
    const idx = this.chapterIndex();
    const currentIdx = idx.findIndex(c => c.id === this.activeChapterId());
    if (currentIdx < 0 || currentIdx >= idx.length - 1) return null;
    return idx[currentIdx + 1].id;
  });

  themeVars = computed(() => {
    const t = this.settings.getTheme();
    return {
      'background': t.bg,
      '--t-text': t.textMain,
      '--t-dim': t.textDim,
      '--t-faint': t.textFaint,
      '--t-border': t.border,
      '--t-card': t.card,
      '--t-hover': t.hover,
      '--t-gold': t.gold,
      '--t-gold-light': t.goldLight,
      '--t-gold-dim': t.goldDim,
      '--t-teal': t.teal,
      '--t-red': t.red,
      '--t-dialogue': t.dialogue,
      '--t-sys-bg': t.systemBg,
      '--t-sys-border': t.systemBorder,
    };
  });

  constructor() {
    SettingsPanelComponent.onClose(() => this.showSettings.set(false));

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.showScrollTop.set(window.scrollY > 400);
      });
    }
  }

  private get storageKey() {
    return `bx-chapter-${this.novelId}`;
  }

  private get scrollKey() {
    return `bx-scroll-${this.novelId}`;
  }

  ngOnInit() {
    this.novelId = this.route.snapshot.paramMap.get('novelId')!;

    // Restore last viewed chapter
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.activeChapterId.set(saved);
    }

    this.novelService.getNovel(this.novelId).subscribe(novel => {
      this.novel.set(novel);
    });
    this.novelService.getChaptersIndex(this.novelId).subscribe(idx => {
      this.chaptersIdx.set(idx);
      this.loadChapter(this.activeChapterId());
    });
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scrollHandler);
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
  }

  private onScroll() {
    if (this.scrollTimer) clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const chapterId = this.activeChapterId();
      if (chapterId && chapterId !== 'portada') {
        localStorage.setItem(this.scrollKey, JSON.stringify({
          chapter: chapterId,
          scrollY: window.scrollY
        }));
      }
    }, 300);
  }

  private restoreScrollPosition() {
    try {
      const raw = localStorage.getItem(this.scrollKey);
      if (!raw) return;
      const { chapter, scrollY } = JSON.parse(raw);
      if (chapter === this.activeChapterId() && scrollY > 0) {
        setTimeout(() => window.scrollTo({ top: scrollY, behavior: 'instant' }), 200);
      }
    } catch {}
  }

  onChapterSelected(id: string) {
    this.activeChapterId.set(id);
    this.mobileSidebar.set(false);
    localStorage.setItem(this.storageKey, id);
    localStorage.removeItem(this.scrollKey);
    this.loadChapter(id);
    this.scrollToTop();
  }

  private loadChapter(id: string) {
    if (!id || id === 'portada') return;
    // Skip if already loaded
    if (this.chapters().has(id)) {
      this.restoreScrollPosition();
      this.preloadAdjacent();
      return;
    }
    this.novelService.getChapter(this.novelId, id).subscribe(ch => {
      this.chapters.update(map => {
        const newMap = new Map(map);
        newMap.set(id, ch);
        return newMap;
      });
      if (id === this.activeChapterId()) {
        this.restoreScrollPosition();
        this.preloadAdjacent();
      }
    });
  }

  private preloadAdjacent() {
    const prev = this.prevChapterId();
    const next = this.nextChapterId();
    if (prev && !this.chapters().has(prev)) {
      this.novelService.getChapter(this.novelId, prev).subscribe(ch => {
        this.chapters.update(map => { const m = new Map(map); m.set(prev, ch); return m; });
      });
    }
    if (next && !this.chapters().has(next)) {
      this.novelService.getChapter(this.novelId, next).subscribe(ch => {
        this.chapters.update(map => { const m = new Map(map); m.set(next!, ch); return m; });
      });
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
