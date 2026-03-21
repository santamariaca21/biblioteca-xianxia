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
                  <div class="abilities-label">TALENTOS</div>
                  @for (t of ch.stats.talentos; track t.nombre) {
                    <div class="talent-stat-row" [attr.data-tipo]="t.tipo">
                      <div class="talent-stat-info">
                        <span class="talent-stat-icon" [attr.data-tipo]="t.tipo">
                          @switch (t.tipo) {
                            @case ('cultivation') { <app-icon name="sparkles" [size]="12" /> }
                            @case ('speed') { <app-icon name="zap" [size]="12" /> }
                            @case ('blade') { <app-icon name="swords" [size]="12" /> }
                            @case ('sword') { <app-icon name="swords" [size]="12" /> }
                            @case ('shadow') { <app-icon name="eye-off" [size]="12" /> }
                            @case ('healing') { <app-icon name="shield" [size]="12" /> }
                            @case ('strength') { <app-icon name="zap" [size]="12" /> }
                            @case ('defense') { <app-icon name="shield" [size]="12" /> }
                            @case ('bone') { <app-icon name="shield" [size]="12" /> }
                            @case ('space') { <app-icon name="globe" [size]="12" /> }
                            @case ('time') { <app-icon name="scroll" [size]="12" /> }
                            @case ('fire') { <app-icon name="zap" [size]="12" /> }
                            @case ('ice') { <app-icon name="sparkles" [size]="12" /> }
                            @case ('formation') { <app-icon name="globe" [size]="12" /> }
                            @case ('flight') { <app-icon name="arrow-right" [size]="12" /> }
                            @case ('soul') { <app-icon name="eye" [size]="12" /> }
                            @case ('blood') { <app-icon name="zap" [size]="12" /> }
                            @case ('tracking') { <app-icon name="eye" [size]="12" /> }
                            @case ('treasure') { <app-icon name="star" [size]="12" /> }
                            @case ('beast-control') { <app-icon name="users" [size]="12" /> }
                            @case ('endurance') { <app-icon name="shield" [size]="12" /> }
                            @case ('death-sub') { <app-icon name="shield" [size]="12" /> }
                            @case ('copy') { <app-icon name="copy" [size]="12" /> }
                            @default { <app-icon name="star" [size]="12" /> }
                          }
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
          <!-- TALENT RANKS (filtered by chapter) -->
          <div class="stats-card">
            <div class="stats-header">
              <app-icon name="bar-chart" [size]="14" />
              <div class="stats-title">Rango de Talentos</div>
            </div>
            <div class="stats-body">
              <ul class="talent-rank-list">
                @for (tr of filteredTalentRanks(); track tr.rank) {
                  <li class="talent-rank-item" [class.highlight]="tr.highlight" [class.current]="tr.isCurrent">
                    <span>{{ tr.rank }}</span>
                    <span>{{ tr.description }}</span>
                  </li>
                }
              </ul>
            </div>
          </div>

          <!-- BASE INFO (filtered by chapter) -->
          <div class="stats-card">
            <div class="stats-header">
              <app-icon name="globe" [size]="14" />
              <div class="stats-title">Info del Mundo</div>
            </div>
            <div class="stats-body">
              @for (item of filteredBaseInfo(); track item.key) {
                <div class="stat-row">
                  <span class="stat-label">{{ item.key }}</span>
                  <span class="stat-value">{{ item.value }}</span>
                </div>
              }
            </div>
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
    .talent-stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 0.5rem;
      margin-bottom: 0.3rem;
      border-radius: 4px;
      background: rgba(0,0,0,0.06);
      border-left: 3px solid var(--t-border, #1e2230);
      &[data-tipo="cultivation"] { border-left-color: var(--t-gold, #8b6914); }
      &[data-tipo="speed"] { border-left-color: #1a7a6e; }
      &[data-tipo="blade"], &[data-tipo="sword"] { border-left-color: #b83030; }
      &[data-tipo="shadow"] { border-left-color: #7a50b0; }
      &[data-tipo="healing"] { border-left-color: #1a8a5a; }
      &[data-tipo="strength"] { border-left-color: #a06810; }
      &[data-tipo="defense"] { border-left-color: #3a6a9a; }
      &[data-tipo="bone"], &[data-tipo="blood-bone"] { border-left-color: #8a4a2a; }
      &[data-tipo="blood"] { border-left-color: #9a2020; }
      &[data-tipo="space"] { border-left-color: #4a6ab0; }
      &[data-tipo="time"] { border-left-color: #6a5aa0; }
      &[data-tipo="fire"] { border-left-color: #c04820; }
      &[data-tipo="ice"] { border-left-color: #2a7a9a; }
      &[data-tipo="formation"] { border-left-color: #5a8a40; }
      &[data-tipo="flight"] { border-left-color: #5090b0; }
      &[data-tipo="soul"] { border-left-color: #8050a0; }
      &[data-tipo="tracking"] { border-left-color: #6a8040; }
      &[data-tipo="treasure"] { border-left-color: #b08a20; }
      &[data-tipo="beast-control"] { border-left-color: #508040; }
      &[data-tipo="endurance"] { border-left-color: #7a6a50; }
      &[data-tipo="death-sub"] { border-left-color: #5a5a6a; }
      &[data-tipo="copy"] { border-left-color: var(--t-gold-dim, #7a6330); }
      &[data-tipo="wind-blade"] { border-left-color: #3a8a6a; }
      &[data-tipo="lightning"] { border-left-color: #a08a20; }
      &[data-tipo="illusion"] { border-left-color: #7a50a0; }
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
      &[data-tipo="cultivation"] { color: var(--t-gold, #8b6914); }
      &[data-tipo="speed"] { color: #1a7a6e; }
      &[data-tipo="blade"], &[data-tipo="sword"] { color: #b83030; }
      &[data-tipo="shadow"] { color: #7a50b0; }
      &[data-tipo="healing"] { color: #1a8a5a; }
      &[data-tipo="strength"] { color: #a06810; }
      &[data-tipo="defense"] { color: #3a6a9a; }
      &[data-tipo="bone"], &[data-tipo="blood-bone"] { color: #8a4a2a; }
      &[data-tipo="blood"] { color: #9a2020; }
      &[data-tipo="space"] { color: #4a6ab0; }
      &[data-tipo="time"] { color: #6a5aa0; }
      &[data-tipo="fire"] { color: #c04820; }
      &[data-tipo="ice"] { color: #2a7a9a; }
      &[data-tipo="formation"] { color: #5a8a40; }
      &[data-tipo="flight"] { color: #5090b0; }
      &[data-tipo="soul"] { color: #8050a0; }
      &[data-tipo="tracking"] { color: #6a8040; }
      &[data-tipo="treasure"] { color: #b08a20; }
      &[data-tipo="beast-control"] { color: #508040; }
      &[data-tipo="endurance"] { color: #7a6a50; }
      &[data-tipo="death-sub"] { color: #5a5a6a; }
      &[data-tipo="copy"] { color: var(--t-gold-dim, #7a6330); }
      &[data-tipo="wind-blade"] { color: #3a8a6a; }
      &[data-tipo="lightning"] { color: #a08a20; }
      &[data-tipo="illusion"] { color: #7a50a0; }
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

  nivelClass(nivel: string): string {
    const n = nivel.toLowerCase();
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
