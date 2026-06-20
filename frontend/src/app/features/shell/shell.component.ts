import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/auth/auth.service';
import { DemoService } from '../../core/demo/demo.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { ThemeService } from '../../core/theme/theme.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { AvatarComponent } from '../../shared/avatar.component';
import { RoleBadgeComponent } from '../../shared/role-badge.component';
import { TourComponent } from '../demo/tour.component';
import { HelpPanelComponent } from '../demo/help-panel.component';

@Component({
  selector: 'tf-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CdkMenuTrigger, CdkMenu, CdkMenuItem,
    LucideAngularModule, TPipe, AvatarComponent, RoleBadgeComponent, TourComponent, HelpPanelComponent,
  ],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="sticky top-0 z-40 flex items-center gap-3 px-4 sm:px-6 h-14 bg-white/90 dark:bg-ink-800/90 backdrop-blur border-b border-ink-200 dark:border-ink-700">
        <!-- Brand -->
        <a routerLink="/app/boards" class="flex items-center gap-2.5 shrink-0">
          <span class="w-7 h-7 rounded-lg bg-accent-600 grid place-items-center">
            <lucide-icon name="layers" class="w-4 h-4 text-white"></lucide-icon>
          </span>
          <span class="font-semibold hidden sm:block">TeamFlow</span>
        </a>

        <!-- Workspace switcher -->
        <span class="text-ink-300 dark:text-ink-600 hidden sm:block">/</span>
        <button [cdkMenuTriggerFor]="wsMenu" data-tour="workspace"
          class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors max-w-[42vw] sm:max-w-none">
          @if (current(); as ws) {
            <span class="w-5 h-5 rounded bg-accent-600 text-white text-[10px] font-bold grid place-items-center font-mono shrink-0">{{ ws.key.slice(0, 2) }}</span>
            <span class="text-sm font-semibold truncate">{{ ws.name }}</span>
          } @else {
            <span class="text-sm text-ink-400">{{ 'shell.noWorkspaces' | t }}</span>
          }
          <lucide-icon name="chevron-down" class="w-4 h-4 text-ink-400 shrink-0"></lucide-icon>
        </button>

        <!-- Primary nav -->
        <nav class="ml-2 hidden md:flex items-center gap-1">
          <a routerLink="/app/boards" routerLinkActive="!text-ink-900 dark:!text-white bg-ink-100 dark:bg-ink-700"
            class="flex items-center gap-1.5 text-sm font-medium text-ink-500 dark:text-ink-400 rounded-lg px-2.5 py-1.5 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">
            <lucide-icon name="layout-grid" class="w-4 h-4"></lucide-icon>{{ 'shell.boards' | t }}
          </a>
          <a routerLink="/app/members" routerLinkActive="!text-ink-900 dark:!text-white bg-ink-100 dark:bg-ink-700"
            class="flex items-center gap-1.5 text-sm font-medium text-ink-500 dark:text-ink-400 rounded-lg px-2.5 py-1.5 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">
            <lucide-icon name="users" class="w-4 h-4"></lucide-icon>{{ 'shell.members' | t }}
          </a>
        </nav>

        <div class="ml-auto flex items-center gap-1.5">
          <button (click)="demo.openHelp()" data-tour="help" [title]="('demo.help' | t)"
            class="h-9 px-2.5 rounded-lg text-xs font-semibold text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-600/15 transition-colors flex items-center gap-1.5">
            <lucide-icon name="activity" class="w-3.5 h-3.5"></lucide-icon><span class="hidden sm:inline">{{ 'demo.help' | t }}</span>
          </button>
          <button (click)="i18n.toggle()" title="Language"
            class="h-9 px-2.5 rounded-lg text-xs font-semibold hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors flex items-center gap-1.5">
            <lucide-icon name="languages" class="w-3.5 h-3.5"></lucide-icon>{{ i18n.lang() === 'en' ? 'EN' : 'ES' }}
          </button>
          <button (click)="theme.toggle()" title="Theme"
            class="h-9 w-9 rounded-lg grid place-items-center hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">
            @if (theme.theme() === 'dark') {
              <lucide-icon name="sun" class="w-4 h-4"></lucide-icon>
            } @else {
              <lucide-icon name="moon" class="w-4 h-4"></lucide-icon>
            }
          </button>

          <!-- User menu -->
          <button [cdkMenuTriggerFor]="userMenu" data-tour="user" class="ml-1 rounded-full focus-visible:ring-2 ring-accent-600/60" title="Account">
            <tf-avatar [name]="user()?.displayName ?? ''" [hue]="user()?.avatarHue ?? 240" size="lg"></tf-avatar>
          </button>
        </div>
      </header>

      <main class="flex-1">
        <router-outlet />
      </main>
    </div>

    <!-- Guided demo layer -->
    <tf-help-panel />
    <tf-tour />

    <!-- Workspace menu -->
    <ng-template #wsMenu>
      <div cdkMenu class="min-w-[240px] rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 shadow-lg p-1.5">
        <p class="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{{ 'shell.switchWorkspace' | t }}</p>
        @for (ws of workspaces(); track ws.id) {
          <button cdkMenuItem (click)="switchTo(ws.id)"
            class="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors outline-none">
            <span class="w-6 h-6 rounded bg-accent-600 text-white text-[10px] font-bold grid place-items-center font-mono shrink-0">{{ ws.key.slice(0, 2) }}</span>
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-medium truncate">{{ ws.name }}</span>
              <tf-role-badge [role]="ws.role"></tf-role-badge>
            </span>
            @if (ws.id === current()?.id) {
              <lucide-icon name="check" class="w-4 h-4 text-accent-600"></lucide-icon>
            }
          </button>
        }
      </div>
    </ng-template>

    <!-- User menu -->
    <ng-template #userMenu>
      <div cdkMenu class="min-w-[220px] rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 shadow-lg p-1.5">
        <div class="px-2.5 py-2">
          <p class="text-sm font-semibold truncate">{{ user()?.displayName }}</p>
          <p class="text-xs text-ink-400 truncate">{{ user()?.email }}</p>
          <div class="mt-2 flex items-center gap-1.5">
            <span class="text-[11px] text-ink-400">{{ 'shell.yourRole' | t }}:</span>
            <tf-role-badge [role]="current()?.role ?? null"></tf-role-badge>
          </div>
        </div>
        <div class="h-px bg-ink-200 dark:bg-ink-700 my-1"></div>
        <a cdkMenuItem routerLink="/app/about"
          class="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors outline-none">
          <lucide-icon name="layers" class="w-4 h-4"></lucide-icon>{{ es() ? 'Sobre el proyecto' : 'About this project' }}
        </a>
        <button cdkMenuItem (click)="signOut()"
          class="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-urgent hover:bg-urgent/10 transition-colors outline-none">
          <lucide-icon name="log-out" class="w-4 h-4"></lucide-icon>{{ 'auth.signOut' | t }}
        </button>
      </div>
    </ng-template>
  `,
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);
  readonly theme = inject(ThemeService);
  readonly demo = inject(DemoService);

  readonly user = this.auth.user;
  readonly workspaces = this.auth.workspaces;
  readonly current = this.auth.currentWorkspace;
  readonly es = () => this.i18n.lang() === 'es';

  ngOnInit(): void {
    this.demo.maybeAutoStart();
  }

  /** Global keys: "?" toggles the explore guide, Escape dismisses the guide/tour. */
  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.demo.tourActive()) { this.demo.endTour(); return; }
      if (this.demo.helpOpen()) { this.demo.closeHelp(); return; }
    }
    const target = event.target as HTMLElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
    if (typing) return;
    if (event.key === '?') {
      event.preventDefault();
      this.demo.helpOpen() ? this.demo.closeHelp() : this.demo.openHelp();
    }
  }

  switchTo(workspaceId: string): void {
    if (workspaceId === this.current()?.id) return;
    this.auth.setWorkspace(workspaceId);
    void this.router.navigateByUrl('/app/boards');
  }

  signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
