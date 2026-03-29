import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgStyle } from '@angular/common';
import { NovelService } from '../../services/novel.service';
import { SettingsService } from '../../services/settings.service';
import { Novel, Chapter, resolveLocalized } from '../../models/novel.model';
import { HeaderComponent } from '../../components/header/header';
import { ChapterSidebarComponent } from '../../components/chapter-sidebar/chapter-sidebar';
import { StatsSidebarComponent } from '../../components/stats-sidebar/stats-sidebar';
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
    StatsSidebarComponent,
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

      <main class="main-content" [style.font-size.px]="settings.settings().fontSize">
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

            <!-- MOBILE STATS SECTION -->
            <!-- MOBILE STATS -->
            @if (settings.settings().showStats) {
              <div class="mobile-stats">
                <div class="chapter-section">
                  <div class="section-header">
                    <div class="section-icon"><app-icon name="swords" [size]="16" /></div>
                    <div class="section-title">{{ ch.stats.label }}</div>
                  </div>
                  <div class="stat-row"><span>Reino</span><span [class]="ch.stats.reinoClass">{{ ch.stats.reino }}</span></div>
                  <div class="stat-row"><span>Fuerza</span><span>{{ ch.stats.fuerza }}</span></div>
                  @if (ch.stats.dominioCerebral) {
                    <div class="stat-row"><span>Dominio Cerebral</span><span class="teal">{{ ch.stats.dominioCerebral }}</span></div>
                  }
                  <div class="stat-row"><span>Ubicación</span><span>{{ ch.stats.ubicacion }}</span></div>
                  @if (ch.stats.talentos && ch.stats.talentos.length > 0) {
                    <div class="mobile-talents-label">TALENTOS</div>
                    @for (t of ch.stats.talentos; track t.nombre) {
                      <div class="mobile-talent-row">
                        <span class="mobile-talent-name">{{ t.nombre }}</span>
                        <span class="mobile-talent-nivel">{{ t.nivel }}</span>
                        @if (t.estado) {
                          <span class="mobile-talent-estado" [attr.data-estado]="t.estado">{{ t.estado }}</span>
                        }
                      </div>
                    }
                  }
                </div>
              </div>
            }

            <!-- CHAPTER NAVIGATION -->
            <div class="chapter-nav">
              <button class="nav-btn" [disabled]="!prevChapterId()" (click)="onChapterSelected(prevChapterId()!)"><app-icon name="chevron-left" [size]="14" /> Anterior</button>
              <span class="nav-indicator">CAP. {{ ch.number }} / {{ chapterIndex().length }}</span>
              <button class="nav-btn next" [disabled]="!nextChapterId()" (click)="onChapterSelected(nextChapterId()!)">Siguiente <app-icon name="chevron-right" [size]="14" /></button>
            </div>
          </div>
        }
      </main>

      <app-stats-sidebar [chapter]="currentChapter()" [novel]="novel()" />
    </div>

    @if (showSettings()) {
      <app-settings-panel />
    }

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
  activeChapterId = signal('portada');
  showSettings = signal(false);
  mobileSidebar = signal(false);
  showScrollTop = signal(false);

  lang = computed(() => this.settings.settings().language);

  chapterIndex = computed(() => {
    const n = this.novel();
    if (!n) return [];
    const l = this.lang();
    return (n.chapters as any as string[]).map((id, i) => {
      const ch = this.chapters().get(id);
      return { id, number: i + 1, title: ch ? resolveLocalized(ch.title, l) : `Capítulo ${i + 1}` };
    });
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
      const chapterIds = novel.chapters as any as string[];
      chapterIds.forEach(chId => {
        this.novelService.getChapter(this.novelId, chId).subscribe(ch => {
          this.chapters.update(map => {
            const newMap = new Map(map);
            newMap.set(chId, ch);
            return newMap;
          });
          // Restore scroll position after the active chapter loads
          if (chId === this.activeChapterId.call(this)) {
            this.restoreScrollPosition();
          }
        });
      });
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
    this.scrollToTop();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
