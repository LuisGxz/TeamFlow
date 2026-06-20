import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Endpoints that must NOT carry a bearer token / trigger a refresh loop. */
const ANON_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];

function isApi(url: string): boolean {
  return url.startsWith(environment.apiBase);
}
function isAnon(url: string): boolean {
  return ANON_PATHS.some((p) => url.includes(p));
}

function withCredentials(req: HttpRequest<unknown>, auth: AuthService): HttpRequest<unknown> {
  const token = auth.getAccessToken();
  const workspaceId = auth.getWorkspaceId();
  let headers = req.headers;
  if (token) headers = headers.set('Authorization', `Bearer ${token}`);
  if (workspaceId) headers = headers.set('X-Workspace-Id', workspaceId);
  return req.clone({ headers });
}

/**
 * Attaches the access token and active workspace to every API request. On a 401 it transparently refreshes
 * once and retries; if the refresh fails, the session is cleared and the user is sent to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isApi(req.url) || isAnon(req.url)) {
    return next(req);
  }

  return next(withCredentials(req, auth)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || !auth.getRefreshToken()) {
        return throwError(() => err);
      }
      return refreshAndRetry(req, next, auth, router);
    }),
  );
};

function refreshAndRetry(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  return auth.refresh().pipe(
    switchMap(() => next(withCredentials(req, auth))),
    catchError((err) => {
      auth.clear();
      void router.navigate(['/login']);
      return throwError(() => err);
    }),
  );
}
