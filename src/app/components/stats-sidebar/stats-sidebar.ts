import { Component, input, inject, computed } from '@angular/core';
import { SettingsService } from '../../services/settings.service';
import { Chapter, Novel } from '../../models/novel.model';
import { KeyValuePipe } from '@angular/common';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-stats-sidebar',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (settings.settings().showStats) {
      <aside class="sidebar-right">
        @if (chapter(); as ch) {
          <!-- CHARACTER STATS -->
          <div class="stats-card">
            <div class="stats-header">
              <app-icon name="swords" [size]="14" />
              <div class="stats-title">{{ ch.stats.label }}</div>
            </div>
            <div class="stats-body">
              <div class="char-name">Ye Tian</div>
              <div class="char-subtitle">Protagonista · Transmigrado</div>
              <div class="stat-row">
                <span class="stat-label">Edad</span>
                <span class="stat-value">{{ ch.stats.edad || '15 años' }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Reino</span>
                <span class="stat-value" [class]="ch.stats.reinoClass">{{ ch.stats.reino }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Fuerza Base</span>
                <span class="stat-value">{{ ch.stats.fuerza }}</span>
              </div>
              @if (ch.stats.dominioCerebral) {
                <div class="stat-row">
                  <span class="stat-label">Dominio Cerebral</span>
                  <span class="stat-value teal">{{ ch.stats.dominioCerebral }}</span>
                </div>
              }
              @if (ch.stats.golpeMax) {
                <div class="stat-row">
                  <span class="stat-label">Golpe Máximo</span>
                  <span class="stat-value gold">{{ ch.stats.golpeMax }}</span>
                </div>
              }
              <div class="stat-row">
                <span class="stat-label">Ubicación</span>
                <span class="stat-value">{{ ch.stats.ubicacion }}</span>
              </div>
              @if (ch.stats.talentos && ch.stats.talentos.length > 0) {
                <div class="talents-section">
                  <div class="abilities-label">CULTIVO</div>
                  @for (t of filterTalentos(ch.stats.talentos, true); track t.nombre) {
                    <div class="talent-stat-row" [style.border-left-color]="tipoColor(t.tipo)">
                      <div class="talent-stat-info">
                        <span class="talent-stat-icon" [style.color]="tipoColor(t.tipo)">
                          <app-icon [name]="tipoIcon(t.tipo)" [size]="12" />
                        </span>
                        <span class="talent-stat-name">{{ t.nombre }}</span>
                      </div>
                      <div class="talent-stat-meta">
                        <span class="talent-stat-nivel" [attr.data-nivel]="nivelClass(t.nivel)">{{ t.nivel }}</span>
                        @if (t.estado) {
                          <span class="talent-stat-estado" [attr.data-estado]="t.estado">{{ t.estado }}</span>
                        }
                      </div>
                    </div>
                  }
                  <div class="abilities-label talents-divider">ESPECIALES</div>
                  @for (t of filterTalentos(ch.stats.talentos, false); track t.nombre) {
                    <div class="talent-stat-row" [style.border-left-color]="tipoColor(t.tipo)">
                      <div class="talent-stat-info">
                        <span class="talent-stat-icon" [style.color]="tipoColor(t.tipo)">
                          <app-icon [name]="tipoIcon(t.tipo)" [size]="12" />
                        </span>
                        <span class="talent-stat-name">{{ t.nombre }}</span>
                      </div>
                      <div class="talent-stat-meta">
                        <span class="talent-stat-nivel" [attr.data-nivel]="nivelClass(t.nivel)">{{ t.nivel }}</span>
                        @if (t.estado) {
                          <span class="talent-stat-estado" [attr.data-estado]="t.estado">{{ t.estado }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        @if (novel(); as n) {
          <!-- REMOVED: Talent Ranks, Base Info, Characters -->
          </div>
        }
      </aside>
    }
  `,
  styles: [`
    .sidebar-right {
      border-left: 1px solid var(--t-border, #1e2230);
      padding: 1.5rem;
      position: sticky;
      top: 56px;
      height: calc(100vh - 56px);
      overflow-y: auto;
      &::-webkit-scrollbar { width: 3px; }
      &::-webkit-scrollbar-thumb { background: var(--t-sys-border, rgba(201,168,76,0.25)); border-radius: 2px; }
    }
    .stats-card {
      background: var(--t-card, #13161e);
      border: 1px solid var(--t-border, #1e2230);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    .stats-header {
      background: var(--t-sys-bg, rgba(201,168,76,0.08));
      border-bottom: 1px solid var(--t-border, #1e2230);
      padding: 0.8rem 1rem;
      display: flex; align-items: center; gap: 0.6rem;
    }
    .stats-title {
      font-family: 'Cinzel', serif;
      font-size: 0.65rem;
      letter-spacing: 0.2em;
      color: var(--t-gold, #c9a84c);
      text-transform: uppercase;
    }
    .stats-body { padding: 1rem; }
    .char-name {
      font-family: 'Cinzel', serif;
      font-size: 1.1rem;
      color: var(--t-text, #e8e0d0);
      margin-bottom: 0.2rem;
    }
    .char-subtitle {
      font-size: 0.75rem;
      color: var(--t-dim, #8a8070);
      margin-bottom: 1rem;
      font-style: italic;
    }
    .stat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--t-faint, #3a3830);
      font-size: 0.8rem;
      &:last-child { border-bottom: none; }
    }
    .stat-label { color: var(--t-dim, #8a8070); }
    .stat-value { color: var(--t-text, #e8e0d0); font-style: italic; }
    .teal { color: var(--t-teal, #4ecdc4) !important; }
    .gold { color: var(--t-gold, #c9a84c) !important; }
    .red { color: var(--t-red, #e06070) !important; }
    .abilities-section {
      margin-top: 1rem;
    }
    .abilities-label {
      font-size: 0.65rem;
      color: var(--t-gold-dim, #7a6330);
      font-family: 'Cinzel', serif;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    .ability-badge {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--t-sys-bg, rgba(201,168,76,0.08));
      border: 1px solid var(--t-sys-border, rgba(201,168,76,0.25));
      border-radius: 5px;
      padding: 0.5rem 0.8rem;
      margin-top: 0.4rem;
      font-size: 0.78rem;
      color: var(--t-gold-light, #e8c97a);
    }
    .talents-section {
      margin-top: 0.8rem;
    }
    .talents-divider {
      margin-top: 0.8rem;
      padding-top: 0.6rem;
      border-top: 1px solid var(--t-border, #1e2230);
    }
    .talent-stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 0.5rem;
      margin-bottom: 0.3rem;
      border-radius: 4px;
      background: rgba(0,0,0,0.06);
      border-left: 3px solid var(--t-border, #1e2230);
    }
    .talent-stat-info {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .talent-stat-icon {
      display: grid;
      place-items: center;
      line-height: 0;
    }
    .talent-stat-name {
      font-size: 0.72rem;
      color: var(--t-text, #e8e0d0);
      font-weight: 500;
    }
    .talent-stat-meta {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .talent-stat-nivel {
      font-family: 'Cinzel', serif;
      font-size: 0.58rem;
      letter-spacing: 0.03em;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      // Color by LEVEL (not type)
      &[data-nivel="debil"] { color: #7a7a7a; background: rgba(128,128,128,0.1); }
      &[data-nivel="inferior"] { color: #6a6a5a; background: rgba(106,106,90,0.1); }
      &[data-nivel="elemental"] { color: #2a7a5a; background: rgba(42,122,90,0.1); }
      &[data-nivel="medio"] { color: #2a6a9a; background: rgba(42,106,154,0.1); }
      &[data-nivel="alto"] { color: #6a3a9a; background: rgba(106,58,154,0.1); }
      &[data-nivel="supremo"] { color: #a06010; background: rgba(160,96,16,0.1); }
      &[data-nivel="extraordinario"] { color: #b03030; background: rgba(176,48,48,0.1); }
      &[data-nivel="estrella-matutina"] { color: #8a6a10; background: rgba(138,106,16,0.12); }
      &[data-nivel="luna-brillante"] { color: #4a6a8a; background: rgba(74,106,138,0.12); }
      &[data-nivel="sol-naciente"] { color: #c04010; background: rgba(192,64,16,0.12); }
      &[data-nivel="pseudo-arcano"] { color: #6a2a8a; background: rgba(106,42,138,0.15); }
      &[data-nivel="arcano"] { color: #9a1a4a; background: rgba(154,26,74,0.15); }
      &[data-nivel="divino"] { color: #c9a84c; background: rgba(201,168,76,0.18); }
      &[data-nivel="copy-info"] { color: var(--t-dim, #8a8070); background: rgba(128,128,128,0.08); }
      &[data-nivel="default"] { color: var(--t-dim, #8a8070); background: rgba(128,128,128,0.08); }
    }
    .talent-stat-estado {
      font-size: 0.5rem;
      padding: 0.1rem 0.3rem;
      border-radius: 2px;
      text-transform: uppercase;
      font-family: 'Cinzel', serif;
      letter-spacing: 0.03em;
      &[data-estado="activo"] { color: #1a8a5a; background: rgba(26,138,90,0.12); }
      &[data-estado="copiado"] { color: var(--t-gold, #8b6914); background: rgba(139,105,20,0.12); }
      &[data-estado="dormido"] { color: var(--t-dim, #888); background: rgba(128,128,128,0.1); }
      &[data-estado="por fusionar"] { color: #b07020; background: rgba(176,112,32,0.12); }
    }
    .talent-rank-list {
      list-style: none;
      display: flex; flex-direction: column; gap: 0.3rem;
      padding: 0; margin: 0;
    }
    .talent-rank-item {
      font-size: 0.78rem;
      padding: 0.35rem 0.6rem;
      border-radius: 4px;
      color: var(--t-dim, #8a8070);
      display: flex; justify-content: space-between;
      &.highlight {
        background: var(--t-sys-bg, rgba(201,168,76,0.08));
        color: var(--t-gold-light, #e0c090);
        span:last-child { color: var(--t-gold, #c9a84c); }
      }
      &.current {
        background: rgba(155,35,53,0.1);
        color: var(--t-red, #e06070);
      }
    }
    @media (max-width: 900px) {
      .sidebar-right { display: none; }
    }
  `],
})
export class StatsSidebarComponent {
  settings = inject(SettingsService);
  chapter = input<Chapter | null>(null);
  novel = input<Novel | null>(null);

  private chapterNumber = computed(() => this.chapter()?.number ?? 0);

  private readonly TIPO_COLORS: Record<string, string> = {
    'cultivation': '#8b6914', 'speed': '#1a7a6e', 'blade': '#b83030', 'sword': '#b83030',
    'shadow': '#7a50b0', 'healing': '#1a8a5a', 'strength': '#a06810', 'defense': '#3a6a9a',
    'bone': '#8a4a2a', 'blood-bone': '#8a4a2a', 'blood': '#9a2020', 'space': '#4a6ab0',
    'time': '#6a5aa0', 'fire': '#c04820', 'ice': '#2a7a9a', 'formation': '#5a8a40',
    'flight': '#5090b0', 'soul': '#8050a0', 'tracking': '#6a8040', 'treasure': '#b08a20',
    'beast-control': '#508040', 'endurance': '#7a6a50', 'death-sub': '#5a5a6a',
    'copy': '#7a6330', 'wind-blade': '#3a8a6a', 'lightning': '#a08a20', 'illusion': '#7a50a0',
    'camouflage': '#4a6a4a', 'blood-eye': '#8a2040', 'storm': '#3a5a8a', 'lunar': '#5a6a9a',
    'hypnosis': '#6a3a7a', 'suspended-death': '#5a4a5a', 'water': '#2a6a8a', 'earth': '#7a6a3a',
    'vine': '#3a7a3a', 'shadow-clone': '#6a4a8a', 'contract': '#6a5a3a', 'soul-thorn': '#7a3a5a',
    'five-elements': '#5a6a3a', 'comprehension': '#5a5a7a', 'slash': '#9a3a3a', 'shatter': '#8a4a3a',
    'good-evil': '#5a5a5a', 'claw': '#7a5a3a', 'insight': '#4a7a7a', 'life': '#2a8a4a',
    'stealth': '#4a4a6a', 'soul-spear': '#7a3a6a', 'heal-others': '#2a7a5a', 'moon': '#5a6a9a',
    'water-escape': '#2a5a7a',
  };

  private readonly TIPO_ICONS: Record<string, string> = {
    'cultivation': 'sparkles', 'speed': 'zap', 'blade': 'swords', 'sword': 'swords',
    'shadow': 'eye-off', 'healing': 'heart-pulse', 'strength': 'mountain',
    'defense': 'shield', 'bone': 'bolt', 'blood-bone': 'bolt', 'blood': 'droplets',
    'space': 'globe', 'time': 'clock', 'fire': 'flame', 'ice': 'snowflake',
    'formation': 'grid', 'flight': 'feather', 'soul': 'brain', 'tracking': 'crosshair',
    'treasure': 'gem', 'beast-control': 'paw', 'endurance': 'anchor',
    'death-sub': 'skull', 'copy': 'copy', 'wind-blade': 'wind', 'lightning': 'zap',
    'illusion': 'eye', 'camouflage': 'eye-off', 'blood-eye': 'eye',
    'storm': 'cloud', 'lunar': 'moon-icon', 'hypnosis': 'target',
    'suspended-death': 'skull', 'water': 'droplets', 'earth': 'mountain',
    'vine': 'leaf', 'shadow-clone': 'users', 'contract': 'link',
    'soul-thorn': 'zap', 'five-elements': 'layers', 'comprehension': 'sun',
    'slash': 'swords', 'shatter': 'zap', 'good-evil': 'repeat',
    'claw': 'paw', 'insight': 'compass', 'life': 'heart-pulse',
    'stealth': 'eye-off', 'soul-spear': 'zap', 'heal-others': 'heart-pulse',
    'moon': 'moon-icon', 'water-escape': 'droplets',
  };

  tipoColor(tipo: string): string {
    return this.TIPO_COLORS[tipo] ?? '#7a7a7a';
  }

  tipoIcon(tipo: string): string {
    return this.TIPO_ICONS[tipo] ?? 'star';
  }

  private readonly CULTIVO_TIPOS = new Set(['cultivation', 'copy']);

  filterTalentos(talentos: any[], isCultivo: boolean): any[] {
    return talentos.filter(t => isCultivo ? this.CULTIVO_TIPOS.has(t.tipo) : !this.CULTIVO_TIPOS.has(t.tipo));
  }

  nivelClass(nivel: string): string {
    const n = nivel.toLowerCase();
    if (n.includes('divino')) return 'divino';
    if (n === 'arcano' || (n.includes('arcano') && !n.includes('pseudo'))) return 'arcano';
    if (n.includes('sol naciente')) return 'sol-naciente';
    if (n.includes('luna brillante')) return 'luna-brillante';
    if (n.includes('estrella matutina')) return 'estrella-matutina';
    if (n.includes('pseudo')) return 'pseudo-arcano';
    if (n.includes('extraordinario')) return 'extraordinario';
    if (n.includes('supremo')) return 'supremo';
    if (n.includes('alto')) return 'alto';
    if (n.includes('medio')) return 'medio';
    if (n.includes('elemental') || n.includes('primario')) return 'elemental';
    if (n.includes('inferior')) return 'inferior';
    if (n.includes('débil') || n.includes('debil')) return 'debil';
    if (n.includes('contacto') || n.includes('distancia')) return 'copy-info';
    return 'default';
  }

  filteredTalentRanks = computed(() => {
    const n = this.novel();
    const num = this.chapterNumber();
    if (!n) return [];
    return n.talentRanks.filter(tr => !tr.revealedAt || tr.revealedAt <= num);
  });

  filteredTalentRanksByCategory(category: string) {
    return this.filteredTalentRanks().filter(tr => (tr.category ?? 'cultivation') === category);
  }

  filteredBaseInfo = computed(() => {
    const n = this.novel();
    const num = this.chapterNumber();
    if (!n?.baseInfoProgressive) {
      if (!n?.baseInfo) return [];
      return Object.entries(n.baseInfo).map(([key, value]) => ({ key, value }));
    }
    return n.baseInfoProgressive.filter(item => {
      const revealed = !item.revealedAt || item.revealedAt <= num;
      const notReplaced = !item.replacedAt || item.replacedAt > num;
      return revealed && notReplaced;
    });
  });
}
