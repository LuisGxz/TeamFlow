import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { DemoService } from '../../core/demo/demo.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { WorkspaceRole, roleAtLeast } from '../../core/models/models';
import { RoleBadgeComponent } from '../../shared/role-badge.component';

interface Capability { key: string; min: WorkspaceRole; }
interface DemoAccount { role: WorkspaceRole; email: string; }

@Component({
  selector: 'tf-help-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, TPipe, RoleBadgeComponent],
  template: `
    @if (demo.helpOpen()) {
      <div class="fixed inset-0 z-[90] flex justify-end" (keydown.escape)="demo.closeHelp()">
        <div class="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]" (click)="demo.closeHelp()"></div>

        <aside class="relative w-full sm:w-[400px] h-full bg-white dark:bg-ink-800 border-l border-ink-200 dark:border-ink-700 shadow-2xl flex flex-col">
          <header class="flex items-center gap-2 px-5 py-4 border-b border-ink-200 dark:border-ink-700">
            <span class="w-8 h-8 rounded-lg bg-accent-600 grid place-items-center"><lucide-icon name="layers" class="w-4 h-4 text-white"></lucide-icon></span>
            <h2 class="font-semibold">{{ 'demo.help' | t }}</h2>
            <button (click)="demo.closeHelp()" class="ml-auto w-8 h-8 rounded-lg grid place-items-center text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"><lucide-icon name="x" class="w-4 h-4"></lucide-icon></button>
          </header>

          <div class="flex-1 overflow-y-auto p-5 space-y-6">
            <p class="text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{{ 'demo.intro' | t }}</p>

            <button (click)="demo.startTour()"
              class="w-full rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2">
              <lucide-icon name="activity" class="w-4 h-4"></lucide-icon>{{ 'demo.startTour' | t }}
            </button>

            <!-- Current role + capabilities -->
            <section>
              <div class="flex items-center gap-2 mb-3">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-ink-400">{{ 'demo.capabilities' | t }}</h3>
                <span class="ml-auto flex items-center gap-1.5 text-xs text-ink-500">{{ 'demo.signedInAs' | t }} <tf-role-badge [role]="role()"></tf-role-badge></span>
              </div>
              <ul class="space-y-2">
                @for (cap of capabilities; track cap.key) {
                  <li class="flex items-center gap-2.5 text-sm">
                    @if (can(cap.min)) {
                      <lucide-icon name="check" class="w-4 h-4 text-done shrink-0"></lucide-icon>
                      <span>{{ cap.key | t }}</span>
                    } @else {
                      <lucide-icon name="x" class="w-4 h-4 text-ink-300 dark:text-ink-600 shrink-0"></lucide-icon>
                      <span class="text-ink-400 line-through">{{ cap.key | t }}</span>
                    }
                  </li>
                }
              </ul>
            </section>

            <!-- Cross-role hint -->
            <section class="rounded-xl bg-accent-50 dark:bg-accent-600/15 border border-accent-100 dark:border-accent-600/30 p-4">
              <p class="text-sm text-accent-700 dark:text-accent-200 font-medium flex items-start gap-2">
                <lucide-icon name="users" class="w-4 h-4 mt-0.5 shrink-0"></lucide-icon>
                <span>{{ 'demo.tryAnother' | t }}</span>
              </p>
              <ul class="mt-3 space-y-1.5">
                @for (acc of accounts; track acc.role) {
                  <li class="flex items-center gap-2 text-xs">
                    <tf-role-badge [role]="acc.role"></tf-role-badge>
                    <span class="font-mono text-ink-500 dark:text-ink-400">{{ acc.email }}</span>
                    @if (acc.role === role()) { <span class="text-[10px] text-accent-600 font-semibold ml-auto">●</span> }
                  </li>
                }
              </ul>
              <p class="text-[11px] text-ink-500 dark:text-ink-400 mt-3">{{ 'demo.multiTenantTip' | t }}</p>
            </section>

            <!-- Shortcuts -->
            <section>
              <h3 class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-3">{{ 'demo.shortcuts' | t }}</h3>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2"><span class="kbd">?</span><span class="text-ink-500 dark:text-ink-400">{{ 'demo.help' | t }}</span></li>
                <li class="flex items-center gap-2"><span class="kbd">Esc</span><span class="text-ink-500 dark:text-ink-400">{{ es() ? 'Cerrar panel' : 'Close panel' }}</span></li>
                <li class="flex items-center gap-2"><span class="kbd">N</span><span class="text-ink-500 dark:text-ink-400">{{ es() ? 'Nueva tarjeta (en un tablero)' : 'New card (on a board)' }}</span></li>
              </ul>
            </section>
          </div>
        </aside>
      </div>
    }
  `,
})
export class HelpPanelComponent {
  readonly demo = inject(DemoService);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  readonly role = computed<WorkspaceRole | null>(() => this.auth.currentWorkspace()?.role ?? null);
  readonly es = () => this.i18n.lang() === 'es';

  readonly capabilities: Capability[] = [
    { key: 'cap.viewBoards', min: 'Viewer' },
    { key: 'cap.editCards', min: 'Member' },
    { key: 'cap.manageBoards', min: 'Admin' },
    { key: 'cap.manageMembers', min: 'Admin' },
    { key: 'cap.owner', min: 'Owner' },
  ];

  readonly accounts: DemoAccount[] = [
    { role: 'Owner', email: 'owner@teamflow.app' },
    { role: 'Member', email: 'member@teamflow.app' },
    { role: 'Viewer', email: 'viewer@teamflow.app' },
  ];

  can(min: WorkspaceRole): boolean {
    return roleAtLeast(this.role(), min);
  }
}
