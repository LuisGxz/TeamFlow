import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

/** Allows access to authenticated areas; hydrates the session from stored tokens when needed. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (auth.hasTokens()) {
    return auth.loadMe().pipe(
      map(() => true),
      catchError(() => {
        auth.clear();
        return of(router.parseUrl('/login'));
      }),
    );
  }

  return router.parseUrl('/login');
};

/** Keeps already-signed-in users away from /login and /register. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() || auth.hasTokens()) {
    return router.parseUrl('/app/boards');
  }
  return true;
};
