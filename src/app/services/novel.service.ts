import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Novel, Chapter, ChapterIndexEntry } from '../models/novel.model';

@Injectable({ providedIn: 'root' })
export class NovelService {
  private http = inject(HttpClient);

  getNovels(): Observable<{ id: string; title: string; titleChinese: string; genre: string; description: string; coverColor: string; totalChapters: number }[]> {
    return this.http.get<any[]>('/novels/index.json');
  }

  getNovel(novelId: string): Observable<Novel> {
    return this.http.get<Novel>(`/novels/${novelId}/novel.json`);
  }

  getChaptersIndex(novelId: string): Observable<ChapterIndexEntry[]> {
    return this.http.get<ChapterIndexEntry[]>(`/novels/${novelId}/chapters-index.json`);
  }

  getChapter(novelId: string, chapterId: string): Observable<Chapter> {
    return this.http.get<Chapter>(`/novels/${novelId}/chapters/${chapterId}.json`);
  }
}
