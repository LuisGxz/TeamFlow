import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BoardDetailDto, BoardSummaryDto, ColumnDto, LabelDto } from '../models/models';

/** Boards endpoints. Workspace scoping is applied by the auth interceptor (X-Workspace-Id). */
@Injectable({ providedIn: 'root' })
export class BoardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api`;

  list(): Observable<BoardSummaryDto[]> {
    return this.http.get<BoardSummaryDto[]>(`${this.base}/boards`);
  }

  get(boardId: string): Observable<BoardDetailDto> {
    return this.http.get<BoardDetailDto>(`${this.base}/boards/${boardId}`);
  }

  create(name: string, description?: string): Observable<BoardDetailDto> {
    return this.http.post<BoardDetailDto>(`${this.base}/boards`, { name, description: description ?? null });
  }

  update(boardId: string, name: string, description?: string): Observable<BoardDetailDto> {
    return this.http.put<BoardDetailDto>(`${this.base}/boards/${boardId}`, { name, description: description ?? null });
  }

  remove(boardId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/boards/${boardId}`);
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  createColumn(boardId: string, name: string, isDone = false, wipLimit?: number | null): Observable<ColumnDto> {
    return this.http.post<ColumnDto>(`${this.base}/boards/${boardId}/columns`, { name, isDone, wipLimit: wipLimit ?? null });
  }

  updateColumn(columnId: string, name: string, isDone: boolean, wipLimit?: number | null): Observable<ColumnDto> {
    return this.http.put<ColumnDto>(`${this.base}/columns/${columnId}`, { name, isDone, wipLimit: wipLimit ?? null });
  }

  deleteColumn(columnId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/columns/${columnId}`);
  }

  reorderColumns(boardId: string, columnIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/boards/${boardId}/columns/order`, { columnIds });
  }

  // ── Labels ────────────────────────────────────────────────────────────────

  createLabel(boardId: string, name: string, color: string): Observable<LabelDto> {
    return this.http.post<LabelDto>(`${this.base}/boards/${boardId}/labels`, { name, color });
  }

  updateLabel(labelId: string, name: string, color: string): Observable<LabelDto> {
    return this.http.put<LabelDto>(`${this.base}/labels/${labelId}`, { name, color });
  }

  deleteLabel(labelId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/labels/${labelId}`);
  }
}
