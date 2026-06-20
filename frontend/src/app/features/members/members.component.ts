import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { WorkspaceApi } from '../../core/api/workspace.api';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { MemberDto } from '../../core/models/models';
import { AvatarComponent } from '../../shared/avatar.component';
import { RoleBadgeComponent } from '../../shared/role-badge.component';

@Component({
  selector: 'tf-members',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LucideAngularModule, TPipe, AvatarComponent, RoleBadgeComponent],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6">
        <h1 class="text-xl font-semibold tracking-tight">{{ 'shell.members' | t }}</h1>
        <p class="text-sm text-ink-500 dark:text-ink-400 mt-0.5">
          {{ es() ? 'Personas en' : 'People in' }} <strong>{{ auth.currentWorkspace()?.name }}</strong>
        </p>
      </div>

      @switch (status()) {
        @case ('loading') {
          <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 divide-y divide-ink-100 dark:divide-ink-700">
            @for (s of [1, 2, 3, 4]; track s) {
              <div class="h-14 animate-pulse"></div>
            }
          </div>
        }
        @case ('error') {
          <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-10 text-center">
            <lucide-icon name="alert-circle" class="w-8 h-8 mx-auto text-urgent"></lucide-icon>
            <button (click)="load()" class="mt-4 rounded-lg border border-ink-200 dark:border-ink-700 text-sm font-semibold px-4 py-2 hover:border-ink-300 transition-colors">{{ 'common.retry' | t }}</button>
          </div>
        }
        @case ('ready') {
          <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 overflow-hidden divide-y divide-ink-100 dark:divide-ink-700">
            @for (m of members(); track m.memberId) {
              <div class="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 dark:hover:bg-ink-700/40 transition-colors">
                <tf-avatar [name]="m.displayName" [hue]="m.avatarHue" size="lg"></tf-avatar>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium truncate">{{ m.displayName }}</p>
                  <p class="text-xs text-ink-400 truncate">{{ m.email }}</p>
                </div>
                <span class="text-[11px] text-ink-400 num hidden sm:block">{{ m.joinedAt | date: 'mediumDate' }}</span>
                <tf-role-badge [role]="m.role"></tf-role-badge>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class MembersComponent {
  private readonly api = inject(WorkspaceApi);
  private readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);

  readonly members = signal<MemberDto[]>([]);
  readonly status = signal<'loading' | 'error' | 'ready'>('loading');
  readonly es = () => this.i18n.lang() === 'es';

  constructor() {
    effect(() => {
      const ws = this.auth.currentWorkspace();
      if (ws) this.load();
    });
  }

  load(): void {
    this.status.set('loading');
    this.api.members().subscribe({
      next: (m) => {
        this.members.set(m);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }
}
