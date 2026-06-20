import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BoardApi } from '../../core/api/board.api';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { BoardSummaryDto, roleAtLeast } from '../../core/models/models';

@Component({
  selector: 'tf-boards-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, RouterLink, LucideAngularModule, TPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8" data-tour="boards">
      <div class="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">{{ 'boards.title' | t }}</h1>
          <p class="text-sm text-ink-500 dark:text-ink-400 mt-0.5">{{ 'boards.subtitle' | t }}</p>
        </div>
        @if (canCreate()) {
          <button (click)="openCreate()"
            class="shrink-0 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold px-3 py-2 transition-colors flex items-center gap-1.5">
            <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>{{ 'boards.new' | t }}
          </button>
        } @else {
          <span class="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700 rounded-lg px-2.5 py-1.5">
            <lucide-icon name="lock" class="w-3.5 h-3.5"></lucide-icon>{{ 'demo.readOnly' | t }}
          </span>
        }
      </div>

      @switch (status()) {
        @case ('loading') {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (s of [1, 2, 3]; track s) {
              <div class="h-28 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 animate-pulse"></div>
            }
          </div>
        }
        @case ('error') {
          <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-10 text-center">
            <lucide-icon name="alert-circle" class="w-8 h-8 mx-auto text-urgent"></lucide-icon>
            <p class="text-sm text-ink-500 dark:text-ink-400 mt-3">{{ 'error.network' | t }}</p>
            <button (click)="load()" class="mt-4 rounded-lg border border-ink-200 dark:border-ink-700 text-sm font-semibold px-4 py-2 hover:border-ink-300 transition-colors">
              {{ 'common.retry' | t }}
            </button>
          </div>
        }
        @case ('ready') {
          @if (boards().length === 0) {
            <div class="rounded-xl border border-dashed border-ink-300 dark:border-ink-600 bg-white/50 dark:bg-ink-800/40 p-12 text-center">
              <span class="w-12 h-12 mx-auto rounded-xl bg-ink-100 dark:bg-ink-700 grid place-items-center">
                <lucide-icon name="layout-grid" class="w-6 h-6 text-ink-400"></lucide-icon>
              </span>
              <h2 class="text-base font-semibold mt-4">{{ 'boards.empty' | t }}</h2>
              <p class="text-sm text-ink-500 dark:text-ink-400 mt-1">{{ 'boards.emptyHint' | t }}</p>
              @if (canCreate()) {
                <button (click)="openCreate()" class="mt-5 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold px-4 py-2 transition-colors inline-flex items-center gap-1.5">
                  <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>{{ 'boards.new' | t }}
                </button>
              }
            </div>
          } @else {
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (b of boards(); track b.id) {
                <a [routerLink]="['/app/boards', b.id]"
                  class="tcard rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-4 cursor-pointer flex flex-col">
                  <div class="flex items-start gap-2.5">
                    <span class="w-9 h-9 rounded-lg bg-accent-50 dark:bg-accent-600/20 grid place-items-center shrink-0">
                      <lucide-icon name="folder" class="w-5 h-5 text-accent-600 dark:text-accent-200"></lucide-icon>
                    </span>
                    <div class="min-w-0">
                      <h3 class="font-semibold truncate">{{ b.name }}</h3>
                      <p class="text-xs text-ink-400 num">{{ b.cardCount }} {{ 'boards.cards' | t }}</p>
                    </div>
                  </div>
                  @if (b.description) {
                    <p class="text-sm text-ink-500 dark:text-ink-400 mt-3 line-clamp-2">{{ b.description }}</p>
                  }
                  <p class="text-[11px] text-ink-400 num mt-auto pt-3">{{ b.updatedAt | date: 'mediumDate' }}</p>
                </a>
              }
            </div>
          }
        }
      }
    </div>

    <!-- Create board dialog -->
    @if (creating()) {
      <div class="fixed inset-0 z-50 grid place-items-center p-4 bg-ink-900/40 backdrop-blur-sm" (click)="closeCreate()">
        <div class="w-full max-w-md rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-6 shadow-xl" (click)="$event.stopPropagation()">
          <h2 class="text-lg font-semibold">{{ 'boards.new' | t }}</h2>
          <form (ngSubmit)="create()" class="mt-4 space-y-4">
            <label class="block">
              <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ es() ? 'Nombre' : 'Name' }}</span>
              <input name="bname" required [(ngModel)]="newName" [disabled]="saving()"
                class="mt-1.5 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors"
                [placeholder]="es() ? 'Tablero de Sprint' : 'Sprint board'" autofocus />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-ink-500 dark:text-ink-400">{{ es() ? 'Descripción' : 'Description' }} <span class="text-ink-400 font-normal">({{ 'common.optional' | t }})</span></span>
              <textarea name="bdesc" rows="2" [(ngModel)]="newDesc" [disabled]="saving()"
                class="mt-1.5 w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2.5 text-sm outline-none focus:border-accent-600 transition-colors resize-none"></textarea>
            </label>
            @if (createError()) {
              <p class="text-xs font-medium text-urgent">{{ createError() }}</p>
            }
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" (click)="closeCreate()" [disabled]="saving()"
                class="rounded-lg border border-ink-200 dark:border-ink-700 text-sm font-semibold px-4 py-2 hover:border-ink-300 transition-colors">{{ 'common.cancel' | t }}</button>
              <button type="submit" [disabled]="saving() || !newName().trim()"
                class="rounded-lg bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors flex items-center gap-1.5">
                @if (saving()) { <lucide-icon name="loader" class="w-4 h-4 animate-spin"></lucide-icon> }
                {{ 'common.create' | t }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class BoardsListComponent {
  private readonly api = inject(BoardApi);
  private readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  readonly boards = signal<BoardSummaryDto[]>([]);
  readonly status = signal<'loading' | 'error' | 'ready'>('loading');

  readonly creating = signal(false);
  readonly newName = signal('');
  readonly newDesc = signal('');
  readonly saving = signal(false);
  readonly createError = signal<string | null>(null);

  readonly canCreate = computed(() => roleAtLeast(this.auth.currentWorkspace()?.role, 'Admin'));
  readonly es = () => this.i18n.lang() === 'es';

  constructor() {
    // Reload whenever the active workspace changes (the interceptor scopes the request).
    effect(() => {
      const ws = this.auth.currentWorkspace();
      if (ws) this.load();
    });
  }

  load(): void {
    this.status.set('loading');
    this.api.list().subscribe({
      next: (boards) => {
        this.boards.set(boards);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  openCreate(): void {
    this.newName.set('');
    this.newDesc.set('');
    this.createError.set(null);
    this.creating.set(true);
  }

  closeCreate(): void {
    if (!this.saving()) this.creating.set(false);
  }

  create(): void {
    const name = this.newName().trim();
    if (!name || this.saving()) return;
    this.saving.set(true);
    this.createError.set(null);
    this.api.create(name, this.newDesc().trim() || undefined).subscribe({
      next: (board) => {
        this.boards.update((list) => [
          { id: board.id, name: board.name, slug: board.slug, description: board.description, position: 0, cardCount: 0, updatedAt: new Date().toISOString() },
          ...list,
        ]);
        this.saving.set(false);
        this.creating.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.createError.set(err.error?.message ?? this.i18n.t('error.generic'));
      },
    });
  }
}
