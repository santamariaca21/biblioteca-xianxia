import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NovelService } from '../../services/novel.service';
import { SettingsService, ThemeColors } from '../../services/settings.service';
import { NovelCharacter } from '../../models/novel.model';
import { HeaderComponent } from '../../components/header/header';
import { CharacterCardComponent } from '../../components/character-card/character-card';
import { IconComponent } from '../../components/icon/icon';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-characters',
  standalone: true,
  imports: [RouterLink, NgStyle, HeaderComponent, CharacterCardComponent, IconComponent],
  template: `
    <app-header [title]="novelTitle()" />

    <div class="characters-page" [ngStyle]="themeVars()">
      <div class="page-header">
        <a [routerLink]="['/novel', novelId]" class="back-link"><app-icon name="arrow-left" [size]="13" /> Volver a la novela</a>
        <div class="page-badge">Elenco de Personajes</div>
        <h1 class="page-title">Personajes</h1>
        <p class="page-subtitle">{{ novelTitle() }}</p>
      </div>

      <!-- Filter by role -->
      <div class="role-filters">
        @for (filter of roleFilters; track filter.value) {
          <button
            class="filter-btn"
            [class.active]="activeFilter() === filter.value"
            (click)="activeFilter.set(filter.value)"
          >{{ filter.label }} ({{ countByRole(filter.value) }})</button>
        }
      </div>

      <div class="characters-grid">
        @for (char of filteredCharacters(); track char.id) {
          <div [id]="char.id" class="char-anchor">
            <app-character-card
              [character]="char"
              [compact]="false"
              [novelId]="novelId"
            />
          </div>
        }
      </div>

      @if (filteredCharacters().length === 0) {
        <div class="empty-state">No hay personajes en esta categoría.</div>
      }
    </div>
  `,
  styles: [`
    .characters-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 56px);
      transition: background 0.3s;
    }
    .page-header {
      text-align: center;
      padding: 2rem 0 2.5rem;
    }
    .back-link {
      display: inline-block;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      color: var(--t-gold-dim, #7a6330);
      text-decoration: none;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
      transition: color 0.2s;
      &:hover { color: var(--t-gold, #c9a84c); }
    }
    .page-badge {
      display: inline-block;
      font-family: 'Cinzel', serif;
      font-size: 0.55rem;
      letter-spacing: 0.35em;
      color: var(--t-gold-dim, #7a6330);
      text-transform: uppercase;
      border: 1px solid var(--t-sys-border, rgba(201,168,76,0.25));
      padding: 0.35rem 1rem;
      margin-bottom: 1rem;
    }
    .page-title {
      font-family: 'Cinzel', serif;
      font-size: 2.2rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--t-gold-light, #e8c97a), var(--t-gold, #c9a84c), var(--t-gold-dim, #7a6330));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.3rem;
    }
    .page-subtitle {
      font-size: 0.9rem;
      color: var(--t-dim, #8a8070);
      font-style: italic;
    }
    .role-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .filter-btn {
      background: var(--t-card, #13161e);
      border: 1px solid var(--t-border, #1e2230);
      color: var(--t-dim, #8a8070);
      padding: 0.4rem 0.9rem;
      border-radius: 20px;
      font-size: 0.72rem;
      font-family: 'Cinzel', serif;
      letter-spacing: 0.05em;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { border-color: var(--t-sys-border, rgba(201,168,76,0.25)); }
      &.active {
        border-color: var(--t-gold, #c9a84c);
        color: var(--t-gold, #c9a84c);
        background: var(--t-sys-bg, rgba(201,168,76,0.08));
      }
    }
    .characters-grid {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .char-anchor {
      scroll-margin-top: 80px;
    }
    .empty-state {
      text-align: center;
      color: var(--t-dim, #8a8070);
      font-style: italic;
      padding: 3rem;
    }
    @media (max-width: 600px) {
      .characters-page { padding: 1rem; }
      .page-title { font-size: 1.6rem; }
    }
  `],
})
export class CharactersComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private novelService = inject(NovelService);
  private settingsService = inject(SettingsService);

  novelId = '';
  novelTitle = signal('');
  characters = signal<NovelCharacter[]>([]);
  activeFilter = signal('todos');

  readonly roleFilters = [
    { label: 'Todos', value: 'todos' },
    { label: 'Protagonista', value: 'protagonista' },
    { label: 'Principales', value: 'principal' },
    { label: 'Secundarios', value: 'secundario' },
  ];

  filteredCharacters = computed(() => {
    const filter = this.activeFilter();
    const chars = this.characters();
    if (filter === 'todos') return chars;
    return chars.filter(c => c.role === filter);
  });

  themeVars = computed(() => {
    const t = this.settingsService.getTheme();
    return {
      'background': t.bg,
      '--t-text': t.textMain, '--t-dim': t.textDim, '--t-faint': t.textFaint,
      '--t-border': t.border, '--t-card': t.card, '--t-hover': t.hover,
      '--t-gold': t.gold, '--t-gold-light': t.goldLight, '--t-gold-dim': t.goldDim,
      '--t-teal': t.teal, '--t-red': t.red,
      '--t-sys-bg': t.systemBg, '--t-sys-border': t.systemBorder,
    };
  });

  countByRole(role: string): number {
    if (role === 'todos') return this.characters().length;
    return this.characters().filter(c => c.role === role).length;
  }

  ngOnInit() {
    this.novelId = this.route.snapshot.paramMap.get('novelId')!;

    this.novelService.getNovel(this.novelId).subscribe(n => {
      this.novelTitle.set(n.title);
    });

    this.novelService.getCharacters(this.novelId).subscribe(data => {
      this.characters.set(data.characters);
    });
  }
}
