import { Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelCharacter } from '../../models/novel.model';
import { IconComponent } from '../icon/icon';

@Component({
  selector: 'app-character-card',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="char-card" [class.compact]="compact()" [attr.data-role]="character().role">
      <div class="card-accent"></div>

      @if (compact()) {
        <!-- ═══ COMPACT MODE (in-chapter) ═══ -->
        <div class="card-body">
          <div class="char-avatar">
            <img [src]="imageUrl()" [alt]="character().name" (error)="onImageError($event)" />
            <div class="avatar-role-icon">
              @switch (character().role) {
                @case ('protagonista') { <app-icon name="crown" [size]="12" color="var(--t-gold, #c9a84c)" /> }
                @case ('principal') { <app-icon name="star" [size]="12" color="var(--t-teal, #4ecdc4)" /> }
                @case ('secundario') { <app-icon name="user" [size]="12" color="var(--t-dim, #8a8070)" /> }
                @default { <app-icon name="eye" [size]="12" color="#b08de0" /> }
              }
            </div>
          </div>
          <div class="char-info">
            <div class="char-header">
              <div class="char-name-row">
                <h3 class="char-name">{{ character().name }}</h3>
                @if (character().nameChinese) {
                  <span class="char-chinese">{{ character().nameChinese }}</span>
                }
              </div>
              <span class="char-role-tag" [attr.data-role]="character().role">{{ roleLabel() }}</span>
            </div>
            @if (currentNote(); as note) {
              <p class="char-note">{{ note }}</p>
            }
            @if (showLink() && novelId()) {
              <a [routerLink]="['/novel', novelId(), 'personajes']" [fragment]="character().id" class="char-link">
                <span>Ver ficha completa</span>
                <app-icon name="arrow-right" [size]="13" />
              </a>
            }
          </div>
        </div>
      } @else {
        <!-- ═══ FULL WIKI MODE ═══ -->
        <div class="wiki-layout">
          <!-- Top: Avatar + Sidebar info table -->
          <div class="wiki-top">
            <div class="wiki-portrait">
              <img [src]="imageUrl()" [alt]="character().name" (error)="onImageError($event)" />
            </div>
            <div class="wiki-header-info">
              <div class="wiki-name-row">
                <h2 class="wiki-name">{{ character().name }}</h2>
                @if (character().nameChinese) {
                  <span class="wiki-chinese">{{ character().nameChinese }}</span>
                }
              </div>
              <span class="char-role-tag" [attr.data-role]="character().role">{{ roleLabel() }}</span>

              <!-- Info table -->
              <div class="wiki-info-table">
                @for (item of infoEntries(); track item.key) {
                  <div class="info-row">
                    <span class="info-label">{{ item.label }}</span>
                    <span class="info-value" [class.gold]="item.key === 'talentoCultivo'" [class.teal]="item.key === 'reino'">{{ item.value }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div class="wiki-section">
            <div class="wiki-section-header">
              <app-icon name="book-open" [size]="15" />
              <span>Biografía</span>
            </div>
            <p class="wiki-bio">{{ character().bio }}</p>
          </div>

          <!-- Abilities -->
          @if (character().abilities.length > 0) {
            <div class="wiki-section">
              <div class="wiki-section-header">
                <app-icon name="zap" [size]="15" />
                <span>Habilidades y Talentos</span>
              </div>
              <div class="abilities-grid">
                @for (ability of character().abilities; track ability.name) {
                  <div class="ability-card" [attr.data-status]="ability.status">
                    <div class="ability-header">
                      <span class="ability-name">{{ ability.name }}</span>
                      <div class="ability-badges">
                        @if (ability.rank) {
                          <span class="ability-rank">{{ ability.rank }}</span>
                        }
                        <span class="ability-status" [attr.data-status]="ability.status">{{ statusLabel(ability.status) }}</span>
                      </div>
                    </div>
                    @if (ability.description) {
                      <p class="ability-desc">{{ ability.description }}</p>
                    }
                    @if (ability.acquiredChapter) {
                      <span class="ability-acquired">
                        <app-icon name="scroll" [size]="11" />
                        Capítulo {{ ability.acquiredChapter }}
                      </span>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- Relationships -->
          @if (character().relationships.length > 0) {
            <div class="wiki-section">
              <div class="wiki-section-header">
                <app-icon name="users" [size]="15" />
                <span>Relaciones</span>
              </div>
              <div class="relations-list">
                @for (rel of character().relationships; track rel.characterId) {
                  <a class="relation-item" [routerLink]="[]" [fragment]="rel.characterId">
                    <app-icon name="user" [size]="14" />
                    <span class="relation-name">{{ rel.characterName }}</span>
                    <span class="relation-type">{{ rel.type }}</span>
                  </a>
                }
              </div>
            </div>
          }

          <!-- Timeline -->
          @if (character().chapterAppearances.length > 0) {
            <div class="wiki-section">
              <div class="wiki-section-header">
                <app-icon name="scroll" [size]="15" />
                <span>Línea Temporal</span>
              </div>
              <div class="wiki-timeline">
                @for (app of character().chapterAppearances; track app.chapterId; let last = $last) {
                  <div class="tl-item" [class.last]="last">
                    <div class="tl-rail">
                      <div class="tl-dot" [attr.data-role]="character().role"></div>
                      @if (!last) { <div class="tl-line"></div> }
                    </div>
                    <div class="tl-body">
                      <span class="tl-chapter">Capítulo {{ app.chapterNumber }}</span>
                      <p class="tl-note">{{ app.note }}</p>
                      @if (app.statsSnapshot; as s) {
                        <div class="tl-stats">
                          @if (s.reino) { <span class="tl-stat"><app-icon name="shield" [size]="11" /> {{ s.reino }}</span> }
                          @if (s.talento) { <span class="tl-stat"><app-icon name="sparkles" [size]="11" /> {{ s.talento }}</span> }
                          @if (s.fuerza) { <span class="tl-stat"><app-icon name="zap" [size]="11" /> {{ s.fuerza }}</span> }
                          @if (s.ubicacion) { <span class="tl-stat"><app-icon name="map-pin" [size]="11" /> {{ s.ubicacion }}</span> }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './character-card.scss',
})
export class CharacterCardComponent {
  character = input.required<NovelCharacter>();
  compact = input(false);
  showLink = input(false);
  novelId = input('');
  maxChapter = input<number | null>(null);
  placeholderUrl = input('/novels/i-can-copy-talents/characters/placeholder.svg');

  imageUrl = computed(() => {
    const ch = this.character();
    if (ch.image) {
      const nid = this.novelId() || 'i-can-copy-talents';
      return `/novels/${nid}/characters/${ch.image}`;
    }
    return this.placeholderUrl();
  });

  roleLabel = computed(() => {
    const roles: Record<string, string> = {
      protagonista: 'Protagonista',
      principal: 'Principal',
      secundario: 'Secundario',
      mencion: 'Mención',
    };
    return roles[this.character().role] ?? this.character().role;
  });

  infoEntries = computed(() => {
    const labels: Record<string, string> = {
      edad: 'Edad',
      genero: 'Género',
      reino: 'Reino',
      talentoCultivo: 'Talento de Cultivo',
      afiliacion: 'Afiliación',
      ubicacion: 'Ubicación',
      estado: 'Estado',
      primerAparicion: 'Primera Aparición',
    };
    const info = this.character().info;
    if (!info) return [];
    return Object.entries(info)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => ({ key, label: labels[key] ?? key, value: value! }));
  });

  currentNote = computed(() => {
    const max = this.maxChapter();
    if (max === null) return null;
    const appearances = this.character().chapterAppearances
      .filter(a => a.chapterNumber <= max)
      .sort((a, b) => b.chapterNumber - a.chapterNumber);
    return appearances[0]?.note ?? null;
  });

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      activo: 'Activo',
      dormido: 'Dormido',
      copiado: 'Copiado',
      perdido: 'Perdido',
    };
    return labels[status] ?? status;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = this.placeholderUrl();
  }
}
