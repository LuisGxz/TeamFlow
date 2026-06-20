import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';

/** Centered auth layout: brand mark, theme/language toggles, and a projected card body. */
@Component({
  selector: 'tf-auth-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col bg-ink-100 dark:bg-ink-900">
      <header class="flex items-center justify-between px-6 py-4">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-accent-600 grid place-items-center">
            <lucide-icon name="layers" class="w-4 h-4 text-white"></lucide-icon>
          </span>
          <span class="font-semibold">TeamFlow</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button (click)="i18n.toggle()" title="Language"
            class="h-9 px-3 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-xs font-semibold hover:border-ink-300 dark:hover:border-ink-600 transition-colors flex items-center gap-1.5">
            <lucide-icon name="languages" class="w-3.5 h-3.5"></lucide-icon>{{ i18n.lang() === 'en' ? 'EN' : 'ES' }}
          </button>
          <button (click)="theme.toggle()" title="Theme"
            class="h-9 w-9 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 grid place-items-center hover:border-ink-300 dark:hover:border-ink-600 transition-colors">
            @if (theme.theme() === 'dark') {
              <lucide-icon name="sun" class="w-4 h-4"></lucide-icon>
            } @else {
              <lucide-icon name="moon" class="w-4 h-4"></lucide-icon>
            }
          </button>
        </div>
      </header>

      <main class="flex-1 grid place-items-center px-4 py-8">
        <div class="w-full max-w-md">
          <div class="rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800/60 p-7 shadow-sm">
            <ng-content></ng-content>
          </div>
          <p class="text-center text-[11px] text-ink-400 mt-5 font-mono">
            TeamFlow · multi-tenant project management · Luis Chiquito Vera
          </p>
        </div>
      </main>
    </div>
  `,
})
export class AuthShellComponent {
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
}
