import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { ApiError } from '../../core/models/models';
import { AuthShellComponent } from './auth-shell.component';

@Component({
  selector: 'tf-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LucideAngularModule, TPipe, AuthShellComponent],
  template: `
    <tf-auth-shell>
      <h1 class="text-2xl font-semibold tracking-tight">{{ 'auth.createAccount' | t }}</h1>
      <p class="text-sm text-ink-500 dark:text-ink-400 mt-1 mb-7">{{ 'auth.signUpSubtitle' | t }}</p>

      <form (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'auth.displayName' | t }}</span>
          <input name="name" required [(ngModel)]="displayName" [disabled]="loading()"
            class="mt-1.5 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
            placeholder="Alex Rivera" />
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'auth.workspaceName' | t }}</span>
          <input name="workspace" required [(ngModel)]="workspaceName" [disabled]="loading()"
            class="mt-1.5 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
            placeholder="Acme Inc." />
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'common.email' | t }}</span>
          <input name="email" type="email" autocomplete="email" required [(ngModel)]="email" [disabled]="loading()"
            class="mt-1.5 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
            placeholder="you@company.com" />
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'common.password' | t }}</span>
          <input name="password" type="password" autocomplete="new-password" required [(ngModel)]="password" [disabled]="loading()"
            class="mt-1.5 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
            placeholder="8+ chars, upper, lower, digit" />
        </label>

        @if (error()) {
          <p class="flex items-center gap-2 text-xs font-medium text-urgent bg-urgent/10 rounded-lg px-3 py-2">
            <lucide-icon name="alert-circle" class="w-4 h-4 shrink-0"></lucide-icon>{{ error() }}
          </p>
        }

        <button type="submit" [disabled]="loading() || !valid()"
          class="w-full rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2">
          @if (loading()) {
            <lucide-icon name="loader" class="w-4 h-4 animate-spin"></lucide-icon>{{ 'auth.creatingAccount' | t }}
          } @else {
            {{ 'auth.signUp' | t }}
          }
        </button>
      </form>

      <p class="text-sm text-ink-500 dark:text-ink-400 mt-5 text-center">
        {{ 'auth.haveAccount' | t }}
        <a routerLink="/login" class="font-semibold text-accent-600 hover:text-accent-500 transition-colors">{{ 'auth.signIn' | t }}</a>
      </p>
    </tf-auth-shell>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly displayName = signal('');
  readonly workspaceName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  valid(): boolean {
    return !!this.displayName() && !!this.workspaceName() && !!this.email() && this.password().length >= 8;
  }

  submit(): void {
    if (this.loading() || !this.valid()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.register(this.email(), this.password(), this.displayName(), this.workspaceName()).subscribe({
      next: () => this.router.navigateByUrl('/app/boards'),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: HttpErrorResponse): string {
    if (err.status === 0) return this.i18n.t('error.network');
    const api = err.error as ApiError | undefined;
    const code = api?.code;
    const key = code ? `error.${code}` : 'error.generic';
    const translated = this.i18n.t(key);
    if (translated !== key) return translated;
    // Surface the first validation message if present.
    const first = api?.errors ? Object.values(api.errors)[0]?.[0] : undefined;
    return first ?? api?.message ?? this.i18n.t('error.generic');
  }
}
