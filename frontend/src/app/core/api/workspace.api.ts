import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvitationCreatedDto, InvitationDto, MemberDto, WorkspaceRole } from '../models/models';

/** Member & invitation management for the active workspace. */
@Injectable({ providedIn: 'root' })
export class WorkspaceApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBase}/api/workspace`;

  members(): Observable<MemberDto[]> {
    return this.http.get<MemberDto[]>(`${this.base}/members`);
  }

  changeRole(memberId: string, role: WorkspaceRole): Observable<MemberDto> {
    return this.http.patch<MemberDto>(`${this.base}/members/${memberId}/role`, { role });
  }

  removeMember(memberId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/members/${memberId}`);
  }

  invitations(): Observable<InvitationDto[]> {
    return this.http.get<InvitationDto[]>(`${this.base}/invitations`);
  }

  invite(email: string, role: WorkspaceRole): Observable<InvitationCreatedDto> {
    return this.http.post<InvitationCreatedDto>(`${this.base}/invitations`, { email, role });
  }

  revokeInvitation(invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/invitations/${invitationId}`);
  }
}
