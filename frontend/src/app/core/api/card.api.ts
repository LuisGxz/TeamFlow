import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityDto, CardDetailDto, CommentDto, Priority } from '../models/models';

export interface CreateCardBody {
  columnId: string;
  title: string;
  description?: string | null;
  priority?: Priority | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  labelIds?: string[] | null;
}

export interface UpdateCardBody {
  title: string;
  description?: string | null;
  priority: Priority;
  dueDate?: string | null;
  assigneeId?: string | null;
}

/** Card lifecycle, comments and the activity feed. Workspace scoping comes from the auth interceptor. */
@Injectable({ providedIn: 'root' })
export class CardApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api`;

  get(cardId: string): Observable<CardDetailDto> {
    return this.http.get<CardDetailDto>(`${this.base}/cards/${cardId}`);
  }

  create(body: CreateCardBody): Observable<CardDetailDto> {
    return this.http.post<CardDetailDto>(`${this.base}/cards`, body);
  }

  update(cardId: string, body: UpdateCardBody): Observable<CardDetailDto> {
    return this.http.put<CardDetailDto>(`${this.base}/cards/${cardId}`, body);
  }

  move(cardId: string, targetColumnId: string, position: number): Observable<CardDetailDto> {
    return this.http.patch<CardDetailDto>(`${this.base}/cards/${cardId}/move`, { targetColumnId, position });
  }

  setLabels(cardId: string, labelIds: string[]): Observable<CardDetailDto> {
    return this.http.put<CardDetailDto>(`${this.base}/cards/${cardId}/labels`, { labelIds });
  }

  remove(cardId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/cards/${cardId}`);
  }

  addComment(cardId: string, body: string): Observable<CommentDto> {
    return this.http.post<CommentDto>(`${this.base}/cards/${cardId}/comments`, { body });
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/comments/${commentId}`);
  }

  activity(boardId?: string, take = 30): Observable<ActivityDto[]> {
    const params = boardId ? `?boardId=${boardId}&take=${take}` : `?take=${take}`;
    return this.http.get<ActivityDto[]>(`${this.base}/activity${params}`);
  }
}
