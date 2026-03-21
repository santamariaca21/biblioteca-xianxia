import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NovelService } from '../../services/novel.service';
import { HeaderComponent } from '../../components/header/header';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [RouterLink, HeaderComponent],
  template: `
    <app-header title="Biblioteca" />
    <div class="library">
      <div class="library-hero">
        <div class="hero-badge">Colección de Novelas</div>
        <h1 class="hero-title">Biblioteca<br>Xianxia</h1>
        <p class="hero-subtitle">Novelas de cultivo traducidas al español</p>
        <div class="hero-divider">◆</div>
      </div>

      <div class="novels-grid">
        @for (novel of novels(); track novel.id) {
          <a [routerLink]="['/novel', novel.id]" class="novel-card">
            <div class="card-accent" [style.background]="'linear-gradient(135deg, ' + novel.coverColor + ', transparent)'"></div>
            <div class="card-genre">{{ novel.genre }}</div>
            <h2 class="card-title">{{ novel.title }}</h2>
            <p class="card-chinese">{{ novel.titleChinese }}</p>
            <p class="card-desc">{{ novel.description }}</p>
            <div class="card-meta">
              <span>{{ novel.totalChapters }} capítulos</span>
              <span class="card-arrow">→</span>
            </div>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .library {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 56px);
    }
    .library-hero {
      text-align: center;
      padding: 3rem 0 4rem;
    }
    .hero-badge {
      display: inline-block;
      font-family: 'Cinzel', serif;
      font-size: 0.6rem;
      letter-spacing: 0.35em;
      color: #7a6330;
      text-transform: uppercase;
      border: 1px solid rgba(201,168,76,0.25);
      padding: 0.4rem 1.2rem;
      margin-bottom: 1.5rem;
    }
    .hero-title {
      font-family: 'Cinzel', serif;
      font-size: 3rem;
      font-weight: 800;
      line-height: 1.1;
      background: linear-gradient(135deg, #e8c97a 0%, #c9a84c 40%, #7a6330 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    .hero-subtitle {
      color: #8a8070;
      font-size: 1rem;
      letter-spacing: 0.1em;
      margin-bottom: 1.5rem;
    }
    .hero-divider {
      color: #7a6330;
      font-size: 0.8rem;
      letter-spacing: 0.3em;
    }
    .novels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .novel-card {
      background: #13161e;
      border: 1px solid #1e2230;
      border-radius: 10px;
      padding: 1.5rem;
      text-decoration: none;
      color: inherit;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      &:hover {
        border-color: rgba(201,168,76,0.25);
        transform: translateY(-2px);
        .card-arrow { transform: translateX(4px); }
      }
    }
    .card-accent {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
    }
    .card-genre {
      font-family: 'Cinzel', serif;
      font-size: 0.6rem;
      letter-spacing: 0.25em;
      color: #7a6330;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
      margin-top: 0.5rem;
    }
    .card-title {
      font-family: 'Cinzel', serif;
      font-size: 1.4rem;
      color: #e8e0d0;
      font-weight: 600;
      margin-bottom: 0.2rem;
    }
    .card-chinese {
      font-family: 'Noto Serif SC', serif;
      font-size: 0.85rem;
      color: #8a8070;
      margin-bottom: 1rem;
    }
    .card-desc {
      font-size: 0.9rem;
      color: #8a8070;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #7a6330;
      font-family: 'Cinzel', serif;
      letter-spacing: 0.1em;
    }
    .card-arrow {
      color: #c9a84c;
      font-size: 1.1rem;
      transition: transform 0.2s;
    }
    @media (max-width: 600px) {
      .hero-title { font-size: 2rem; }
      .novels-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class LibraryComponent implements OnInit {
  private novelService = inject(NovelService);
  novels = signal<any[]>([]);

  ngOnInit() {
    this.novelService.getNovels().subscribe(data => this.novels.set(data));
  }
}
