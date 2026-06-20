import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ApiError } from '../../core/models/models';
import { AuthShellComponent } from './auth-shell.component';

/** Redeems an invitation token (from the email accept link) for the signed-in user. */
@Component({
  selector: 'tf-accept-invite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, RouterLink, AuthShellComponent],
  template: `
    <tf-auth-shell>
      @switch (state()) {
        @case ('loading') {
          <div class="py-6 text-center">
            <lucide-icon name="loader" class="w-7 h-7 mx-auto animate-spin text-accent-600"></lucide-icon>
            <p class="text-sm text-ink-500 dark:text-ink-400 mt-3">
              {{ es() ? 'Aceptando invitación…' : 'Accepting invitation…' }}
            </p>
          </div>
        }
        @case ('ok') {
          <div class="py-4 text-center">
            <span class="w-12 h-12 mx-auto rounded-full bg-done/15 grid place-items-center">
              <lucide-icon name="check" class="w-6 h-6 text-done"></lucide-icon>
            </span>
            <h1 class="text-xl font-semibold mt-4">{{ es() ? '¡Listo!' : "You're in!" }}</h1>
            <p class="text-sm text-ink-500 dark:text-ink-400 mt-1">
              {{ es() ? 'Te uniste a' : 'You joined' }} <strong>{{ workspaceName() }}</strong>
              {{ es() ? 'como' : 'as' }} {{ role() }}.
            </p>
            <button (click)="go()" class="mt-5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              {{ es() ? 'Ir a los tableros' : 'Go to boards' }}
            </button>
          </div>
        }
        @case ('error') {
          <div class="py-4 text-center">
            <span class="w-12 h-12 mx-auto rounded-full bg-urgent/15 grid place-items-center">
              <lucide-icon name="alert-circle" class="w-6 h-6 text-urgent"></lucide-icon>
            </span>
            <h1 class="text-xl font-semibold mt-4">{{ es() ? 'No se pudo aceptar' : "Couldn't accept" }}</h1>
            <p class="text-sm text-ink-500 dark:text-ink-400 mt-1">{{ error() }}</p>
            <a routerLink="/app/boards" class="inline-block mt-5 rounded-lg border border-ink-200 dark:border-ink-700 text-sm font-semibold px-5 py-2.5 hover:border-ink-300 transition-colors">
              {{ es() ? 'Ir a la app' : 'Go to the app' }}
            </a>
          </div>
        }
      }
    </tf-auth-shell>
  `,
})
export class AcceptInviteComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  /** Bound from ?token= via withComponentInputBinding(). */
  readonly token = input<string>('');

  readonly state = signal<'loading' | 'ok' | 'error'>('loading');
  readonly workspaceName = signal('');
  readonly role = signal('');
  readonly error = signal('');
  private joinedWorkspaceId: string | null = null;

  readonly es = () => this.i18n.lang() === 'es';

  ngOnInit(): void {
    const token = this.token();
    if (!token) {
      this.state.set('error');
      this.error.set(this.es() ? 'Falta el token de invitación.' : 'Missing invitation token.');
      return;
    }
    this.auth
      .acceptInvite(token)
      .pipe(switchMap((res) => {
        this.workspaceName.set(res.workspaceName);
        this.role.set(res.role);
        this.joinedWorkspaceId = res.workspaceId;
        return this.auth.loadMe();
      }))
      .subscribe({
        next: () => {
          if (this.joinedWorkspaceId) this.auth.setWorkspace(this.joinedWorkspaceId);
          this.state.set('ok');
        },
        error: (err: HttpErrorResponse) => {
          this.state.set('error');
          this.error.set((err.error as ApiError | undefined)?.message ?? this.i18n.t('error.generic'));
        },
      });
  }

  go(): void {
    void this.router.navigateByUrl('/app/boards');
  }
}
