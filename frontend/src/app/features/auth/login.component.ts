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

interface DemoAccount {
  role: string;
  email: string;
  password: string;
  desc: { en: string; es: string };
}

const DEMO: DemoAccount[] = [
  { role: 'Owner', email: 'owner@teamflow.app', password: 'Owner123!', desc: { en: 'Full control · 2 workspaces', es: 'Control total · 2 espacios' } },
  { role: 'Member', email: 'member@teamflow.app', password: 'Member123!', desc: { en: 'Can edit cards', es: 'Edita tarjetas' } },
  { role: 'Viewer', email: 'viewer@teamflow.app', password: 'Viewer123!', desc: { en: 'Read-only', es: 'Solo lectura' } },
];

@Component({
  selector: 'tf-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, LucideAngularModule, TPipe, AuthShellComponent],
  template: `
    <tf-auth-shell>
      <h1 class="text-2xl font-semibold tracking-tight">{{ 'auth.welcomeBack' | t }}</h1>
      <p class="text-sm text-ink-500 dark:text-ink-400 mt-1 mb-7">{{ 'auth.signInSubtitle' | t }}</p>

      <form (ngSubmit)="submit()" class="space-y-4">
        <label class="block">
          <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'common.email' | t }}</span>
          <div class="relative mt-1.5">
            <lucide-icon name="mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"></lucide-icon>
            <input
              name="email" type="email" autocomplete="email" required
              [(ngModel)]="email" [disabled]="loading()"
              class="w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
              placeholder="you@company.com" />
          </div>
        </label>

        <label class="block">
          <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'common.password' | t }}</span>
          <div class="relative mt-1.5">
            <lucide-icon name="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400"></lucide-icon>
            <input
              name="password" type="password" autocomplete="current-password" required
              [(ngModel)]="password" [disabled]="loading()"
              class="w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
              placeholder="••••••••" />
          </div>
        </label>

        @if (error()) {
          <p class="flex items-center gap-2 text-xs font-medium text-urgent bg-urgent/10 rounded-lg px-3 py-2">
            <lucide-icon name="alert-circle" class="w-4 h-4 shrink-0"></lucide-icon>{{ error() }}
          </p>
        }

        <button
          type="submit" [disabled]="loading() || !email() || !password()"
          class="w-full rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2">
          @if (loading()) {
            <lucide-icon name="loader" class="w-4 h-4 animate-spin"></lucide-icon>{{ 'auth.signingIn' | t }}
          } @else {
            {{ 'auth.signIn' | t }}
          }
        </button>
      </form>

      <p class="text-sm text-ink-500 dark:text-ink-400 mt-5 text-center">
        {{ 'auth.noAccount' | t }}
        <a routerLink="/register" class="font-semibold text-accent-600 hover:text-accent-500 transition-colors">{{ 'auth.signUp' | t }}</a>
      </p>

      <!-- Demo accounts -->
      <div class="mt-7 pt-6 border-t border-ink-200 dark:border-ink-700">
        <p class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ 'auth.demoAccounts' | t }}</p>
        <p class="text-[11px] text-ink-400 mb-3">{{ 'auth.demoHint' | t }}</p>
        <div class="grid grid-cols-3 gap-2">
          @for (acc of demo; track acc.role) {
            <button type="button" (click)="useDemo(acc)" [disabled]="loading()"
              class="tcard text-left rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-2.5 py-2 hover:border-accent-600">
              <span class="block text-xs font-bold">{{ ('role.' + acc.role) | t }}</span>
              <span class="block text-[10px] text-ink-400 leading-tight mt-0.5">{{ lang() === 'es' ? acc.desc.es : acc.desc.en }}</span>
            </button>
          }
        </div>
      </div>
    </tf-auth-shell>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly demo = DEMO;
  readonly lang = this.i18n.lang;

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  useDemo(acc: DemoAccount): void {
    this.email.set(acc.email);
    this.password.set(acc.password);
    this.submit();
  }

  submit(): void {
    if (this.loading() || !this.email() || !this.password()) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email(), this.password()).subscribe({
      next: () => this.router.navigateByUrl('/app/boards'),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err));
      },
    });
  }

  private messageFor(err: HttpErrorResponse): string {
    if (err.status === 0) return this.i18n.t('error.network');
    const code = (err.error as ApiError | undefined)?.code;
    const key = code ? `error.${code}` : 'error.generic';
    const translated = this.i18n.t(key);
    return translated === key ? (err.error as ApiError)?.message ?? this.i18n.t('error.generic') : translated;
  }
}
