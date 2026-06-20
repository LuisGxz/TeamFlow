import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcceptInviteResultDto, AuthResponse, MeResponse, UserDto, WorkspaceSummaryDto } from '../models/models';

const ACCESS_KEY = 'tf-access';
const REFRESH_KEY = 'tf-refresh';
const WS_KEY = 'tf-ws';

/**
 * Holds the authenticated session: tokens, the current user, their workspaces, and the active workspace.
 * Tokens persist in localStorage so a refresh keeps the user signed in; the active workspace is the one
 * sent as X-Workspace-Id by the auth interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBase;

  private readonly _user = signal<UserDto | null>(null);
  private readonly _workspaces = signal<WorkspaceSummaryDto[]>([]);
  private readonly _currentWorkspaceId = signal<string | null>(this.read(WS_KEY));
  private accessToken: string | null = this.read(ACCESS_KEY);
  private refreshToken: string | null = this.read(REFRESH_KEY);

  readonly user = this._user.asReadonly();
  readonly workspaces = this._workspaces.asReadonly();

  readonly currentWorkspace = computed<WorkspaceSummaryDto | null>(() => {
    const list = this._workspaces();
    if (list.length === 0) return null;
    return list.find((w) => w.id === this._currentWorkspaceId()) ?? list[0];
  });

  /** True once we have credentials to attempt authenticated calls (user may still need hydration). */
  readonly isAuthenticated = computed(() => this._user() !== null);

  hasTokens(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  getWorkspaceId(): string | null {
    return this.currentWorkspace()?.id ?? null;
  }

  // ── Operations ────────────────────────────────────────────────────────────

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/login`, { email, password })
      .pipe(tap((res) => this.applyAuth(res)));
  }

  register(email: string, password: string, displayName: string, workspaceName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/register`, { email, password, displayName, workspaceName })
      .pipe(tap((res) => this.applyAuth(res)));
  }

  /** Used by the interceptor on a 401. Returns the new tokens or errors if the refresh token is gone/invalid. */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.base}/api/auth/refresh`, { refreshToken: this.refreshToken })
      .pipe(tap((res) => this.applyAuth(res)));
  }

  loadMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.base}/api/auth/me`).pipe(
      tap((res) => {
        this._user.set(res.user);
        this._workspaces.set(res.workspaces);
        this.ensureWorkspaceSelected(res.workspaces);
      }),
    );
  }

  acceptInvite(token: string): Observable<AcceptInviteResultDto> {
    return this.http.post<AcceptInviteResultDto>(`${this.base}/api/invitations/accept`, { token });
  }

  setWorkspace(workspaceId: string): void {
    this._currentWorkspaceId.set(workspaceId);
    this.write(WS_KEY, workspaceId);
  }

  logout(): void {
    const token = this.refreshToken;
    if (token) {
      // Fire-and-forget server-side revocation.
      this.http.post(`${this.base}/api/auth/logout`, { refreshToken: token }).subscribe({ error: () => {} });
    }
    this.clear();
  }

  /** Wipe local session state (used on logout and on an unrecoverable 401). */
  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this._user.set(null);
    this._workspaces.set([]);
    this._currentWorkspaceId.set(null);
    this.remove(ACCESS_KEY);
    this.remove(REFRESH_KEY);
    this.remove(WS_KEY);
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private applyAuth(res: AuthResponse): void {
    this.accessToken = res.tokens.accessToken;
    this.refreshToken = res.tokens.refreshToken;
    this.write(ACCESS_KEY, res.tokens.accessToken);
    this.write(REFRESH_KEY, res.tokens.refreshToken);
    this._user.set(res.user);
    this._workspaces.set(res.workspaces);
    this.ensureWorkspaceSelected(res.workspaces);
  }

  private ensureWorkspaceSelected(workspaces: WorkspaceSummaryDto[]): void {
    const current = this._currentWorkspaceId();
    if (!current || !workspaces.some((w) => w.id === current)) {
      const first = workspaces[0]?.id ?? null;
      this._currentWorkspaceId.set(first);
      if (first) this.write(WS_KEY, first);
    }
  }

  private read(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
  private remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
