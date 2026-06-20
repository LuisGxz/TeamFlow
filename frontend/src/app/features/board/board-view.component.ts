import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { BoardApi } from '../../core/api/board.api';
import { CardApi } from '../../core/api/card.api';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { BoardDetailDto, CardDetailDto, CardSummaryDto, ColumnDto, roleAtLeast } from '../../core/models/models';
import { AvatarComponent } from '../../shared/avatar.component';
import { PriorityIconComponent } from '../../shared/priority-icon.component';
import { CardPanelComponent } from './card-panel.component';

@Component({
  selector: 'tf-board-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule, CdkDropListGroup, CdkDropList, CdkDrag, RouterLink,
    LucideAngularModule, TPipe, AvatarComponent, PriorityIconComponent, CardPanelComponent,
  ],
  template: `
    @switch (status()) {
      @case ('loading') {
        <div class="grid place-items-center py-32">
          <lucide-icon name="loader" class="w-7 h-7 animate-spin text-accent-600"></lucide-icon>
        </div>
      }
      @case ('error') {
        <div class="max-w-md mx-auto text-center py-24">
          <lucide-icon name="alert-circle" class="w-8 h-8 mx-auto text-urgent"></lucide-icon>
          <p class="text-sm text-ink-500 dark:text-ink-400 mt-3">{{ 'board.notFound' | t }}</p>
          <a routerLink="/app/boards" class="inline-block mt-4 text-sm font-semibold text-accent-600">{{ 'board.back' | t }}</a>
        </div>
      }
      @case ('ready') {
        <!-- App bar -->
        <div class="flex items-center gap-3 px-4 sm:px-6 h-12 border-b border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800">
          <a routerLink="/app/boards" class="flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 dark:hover:text-white transition-colors">
            <lucide-icon name="chevron-left" class="w-3.5 h-3.5"></lucide-icon>{{ 'board.back' | t }}
          </a>
          <span class="text-ink-300 dark:text-ink-600">/</span>
          <strong class="text-sm font-semibold truncate">{{ board()?.name }}</strong>
          <span class="text-[11px] num text-ink-400">{{ totalCards() }} {{ 'board.cardsCount' | t }}</span>

          <div class="ml-auto flex items-center gap-2">
            @if (!canEdit()) {
              <span class="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-500 dark:text-ink-400 bg-ink-100 dark:bg-ink-700 rounded-md px-2 py-1">
                <lucide-icon name="lock" class="w-3 h-3"></lucide-icon>{{ 'demo.readOnly' | t }}
              </span>
            }
            <!-- View toggle -->
            <div class="flex rounded-lg border border-ink-200 dark:border-ink-700 overflow-hidden text-xs font-semibold">
              <button (click)="view.set('board')" [class]="view() === 'board' ? activeToggle : idleToggle" class="px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                <lucide-icon name="columns-3" class="w-3.5 h-3.5"></lucide-icon><span class="hidden sm:inline">{{ 'board.boardView' | t }}</span>
              </button>
              <button (click)="view.set('list')" [class]="view() === 'list' ? activeToggle : idleToggle" class="px-2.5 py-1.5 flex items-center gap-1.5 transition-colors">
                <lucide-icon name="layout-list" class="w-3.5 h-3.5"></lucide-icon><span class="hidden sm:inline">{{ 'board.listView' | t }}</span>
              </button>
            </div>
          </div>
        </div>

        @if (view() === 'board') {
          <!-- ── Kanban ── -->
          <div class="overflow-x-auto" cdkDropListGroup>
            <div class="flex gap-3 p-4 sm:p-5 min-h-[calc(100vh-7rem)] items-start">
              @for (col of columns(); track col.id) {
                <section class="w-72 shrink-0 rounded-xl bg-ink-100/70 dark:bg-ink-800/60 border border-ink-200 dark:border-ink-700 flex flex-col max-h-[calc(100vh-8rem)]">
                  <header class="flex items-center gap-2 px-3 py-2.5">
                    <span class="w-2 h-2 rounded-full" [style.background]="dotColor(col)"></span>
                    <span class="text-xs font-semibold truncate">{{ col.name }}</span>
                    <span class="text-[11px] num" [class]="overWip(col) ? 'text-urgent font-semibold' : 'text-ink-400'">
                      {{ col.cards.length }}{{ col.wipLimit ? '/' + col.wipLimit : '' }}
                    </span>
                  </header>

                  <div
                    cdkDropList [id]="col.id" [cdkDropListData]="col.cards"
                    (cdkDropListDropped)="drop($event)"
                    class="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px]">
                    @for (card of col.cards; track card.id) {
                      <article
                        cdkDrag [cdkDragDisabled]="!canEdit()" [cdkDragData]="card"
                        (click)="openCard(card.id)"
                        class="tcard group bg-white dark:bg-ink-800 rounded-lg border border-ink-200 dark:border-ink-700 p-3 cursor-pointer">
                        <div class="flex items-center gap-2 mb-1.5">
                          <span class="font-mono text-[10px] text-ink-400">{{ card.reference }}</span>
                          @for (lbl of card.labels.slice(0, 2); track lbl.id) {
                            <span class="text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none"
                              [style.background]="lbl.color + '22'" [style.color]="lbl.color">{{ lbl.name }}</span>
                          }
                          @if (card.commentCount > 0) {
                            <span class="ml-auto text-[10px] num text-ink-400 flex items-center gap-0.5">
                              <lucide-icon name="message-square" class="w-3 h-3"></lucide-icon>{{ card.commentCount }}
                            </span>
                          }
                        </div>
                        <p class="text-sm font-medium leading-snug" [class.line-through]="card.isCompleted" [class.text-ink-400]="card.isCompleted">{{ card.title }}</p>
                        <div class="flex items-center gap-2 mt-2.5">
                          <tf-priority-icon [priority]="card.priority"></tf-priority-icon>
                          @if (card.dueDate) {
                            <span class="text-[10px] num text-ink-400 flex items-center gap-1">
                              <lucide-icon name="calendar" class="w-3 h-3"></lucide-icon>{{ card.dueDate | date: 'MMM d' }}
                            </span>
                          }
                          @if (card.assignee) {
                            <span class="ml-auto"><tf-avatar [name]="card.assignee.displayName" [hue]="card.assignee.avatarHue" size="sm"></tf-avatar></span>
                          }
                        </div>
                      </article>
                    }
                    @if (col.cards.length === 0 && composingFor() !== col.id) {
                      <p class="text-[11px] text-ink-400 text-center py-3 select-none">{{ 'board.emptyColumn' | t }}</p>
                    }
                  </div>

                  <!-- Quick add -->
                  @if (canEdit()) {
                    <footer class="p-2">
                      @if (composingFor() === col.id) {
                        <textarea #ta name="draft" rows="2" [(ngModel)]="draft"
                          (keydown.enter)="$event.preventDefault(); addCard(col.id)"
                          (keydown.escape)="cancelCompose()"
                          [placeholder]="('board.cardTitlePlaceholder' | t)"
                          class="w-full text-sm rounded-lg border border-accent-600 bg-white dark:bg-ink-900 px-2.5 py-2 outline-none resize-none"></textarea>
                        <div class="flex gap-1.5 mt-1.5">
                          <button (click)="addCard(col.id)" [disabled]="!draft().trim() || saving()"
                            class="rounded-md bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold px-2.5 py-1.5 transition-colors">{{ 'board.addCard' | t }}</button>
                          <button (click)="cancelCompose()" class="rounded-md text-xs font-semibold px-2 py-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">{{ 'common.cancel' | t }}</button>
                        </div>
                      } @else {
                        <button (click)="startCompose(col.id)"
                          class="w-full flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900 dark:hover:text-white rounded-lg px-2 py-1.5 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors">
                          <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>{{ 'board.newCard' | t }}
                        </button>
                      }
                    </footer>
                  }
                </section>
              }
            </div>
          </div>
        } @else {
          <!-- ── List view ── -->
          <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div class="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 overflow-hidden">
              @for (col of columns(); track col.id) {
                <div class="px-4 py-2 bg-ink-50 dark:bg-ink-900/40 border-b border-ink-200 dark:border-ink-700 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" [style.background]="dotColor(col)"></span>
                  <span class="text-xs font-semibold">{{ col.name }}</span>
                  <span class="text-[11px] num text-ink-400">{{ col.cards.length }}</span>
                </div>
                @for (card of col.cards; track card.id) {
                  <div (click)="openCard(card.id)"
                    class="flex items-center gap-3 px-4 py-2.5 border-b border-ink-100 dark:border-ink-700/60 hover:bg-ink-50 dark:hover:bg-ink-700/40 transition-colors cursor-pointer">
                    <tf-priority-icon [priority]="card.priority"></tf-priority-icon>
                    <span class="font-mono text-[11px] text-ink-400 w-16 shrink-0">{{ card.reference }}</span>
                    <span class="text-sm flex-1 truncate" [class.line-through]="card.isCompleted" [class.text-ink-400]="card.isCompleted">{{ card.title }}</span>
                    @for (lbl of card.labels.slice(0, 2); track lbl.id) {
                      <span class="hidden sm:inline text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none" [style.background]="lbl.color + '22'" [style.color]="lbl.color">{{ lbl.name }}</span>
                    }
                    <span class="text-[11px] num text-ink-400 w-14 text-right hidden sm:block">{{ card.dueDate ? (card.dueDate | date: 'MMM d') : '—' }}</span>
                    @if (card.assignee) {
                      <tf-avatar [name]="card.assignee.displayName" [hue]="card.assignee.avatarHue" size="sm"></tf-avatar>
                    } @else {
                      <span class="w-5 h-5 rounded-full border border-dashed border-ink-300 dark:border-ink-600 shrink-0"></span>
                    }
                  </div>
                }
              }
            </div>
          </div>
        }
      }
    }

    <!-- Card detail panel -->
    @if (selectedCardId()) {
      <tf-card-panel
        [cardId]="selectedCardId()!"
        [board]="board()!"
        [canEdit]="canEdit()"
        (closed)="closeCard()"
        (changed)="reload()"></tf-card-panel>
    }
  `,
})
export class BoardViewComponent {
  private readonly boardApi = inject(BoardApi);
  private readonly cardApi = inject(CardApi);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  /** From the route: /app/boards/:boardId and ?card=. */
  readonly boardId = input.required<string>();
  readonly card = input<string | undefined>();

  readonly board = signal<BoardDetailDto | null>(null);
  readonly columns = signal<ColumnDto[]>([]);
  readonly status = signal<'loading' | 'error' | 'ready'>('loading');
  readonly view = signal<'board' | 'list'>('board');

  readonly composingFor = signal<string | null>(null);
  readonly draft = signal('');
  readonly saving = signal(false);

  readonly selectedCardId = computed(() => this.card() ?? null);
  readonly canEdit = computed(() => roleAtLeast(this.auth.currentWorkspace()?.role, 'Member'));
  readonly totalCards = computed(() => this.columns().reduce((n, c) => n + c.cards.length, 0));

  readonly activeToggle = '!text-ink-900 dark:!text-white bg-ink-100 dark:bg-ink-700';
  readonly idleToggle = 'text-ink-500 dark:text-ink-400 bg-white dark:bg-ink-800';

  constructor() {
    effect(() => {
      const id = this.boardId();
      if (id) this.load(id);
    });
  }

  /** "N" starts a new card in the first column (when allowed and not already typing). */
  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const el = event.target as HTMLElement;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return;
    if ((event.key === 'n' || event.key === 'N') && this.canEdit() && this.status() === 'ready' && !this.selectedCardId()) {
      const first = this.columns()[0];
      if (first) {
        event.preventDefault();
        this.view.set('board');
        this.startCompose(first.id);
      }
    }
  }

  load(id: string): void {
    this.status.set('loading');
    this.boardApi.get(id).subscribe({
      next: (board) => {
        this.board.set(board);
        this.columns.set(this.sortColumns(board));
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  reload(): void {
    this.load(this.boardId());
  }

  private sortColumns(board: BoardDetailDto): ColumnDto[] {
    return [...board.columns]
      .sort((a, b) => a.position - b.position)
      .map((c) => ({ ...c, cards: [...c.cards].sort((x, y) => x.position - y.position) }));
  }

  dotColor(col: ColumnDto): string {
    return col.isDone ? '#26A269' : '#9197A3';
  }

  overWip(col: ColumnDto): boolean {
    return col.wipLimit != null && col.cards.length > col.wipLimit;
  }

  // ── Navigation to card panel ───────────────────────────────────────────────

  openCard(cardId: string): void {
    void this.router.navigate([], { queryParams: { card: cardId }, queryParamsHandling: 'merge' });
  }

  closeCard(): void {
    void this.router.navigate([], { queryParams: { card: null }, queryParamsHandling: 'merge' });
  }

  // ── Quick add ──────────────────────────────────────────────────────────────

  startCompose(columnId: string): void {
    this.draft.set('');
    this.composingFor.set(columnId);
  }
  cancelCompose(): void {
    this.composingFor.set(null);
    this.draft.set('');
  }

  addCard(columnId: string): void {
    const title = this.draft().trim();
    if (!title || this.saving()) return;
    this.saving.set(true);
    this.cardApi.create({ columnId, title }).subscribe({
      next: (created) => {
        this.columns.update((cols) =>
          cols.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, this.toSummary(created)] } : c)),
        );
        this.saving.set(false);
        this.draft.set('');
        // keep composing open for rapid entry
      },
      error: () => {
        this.saving.set(false);
        this.reload();
      },
    });
  }

  private toSummary(c: CardDetailDto): CardSummaryDto {
    return {
      id: c.id, number: c.number, reference: c.reference, title: c.title, columnId: c.columnId,
      position: c.position, priority: c.priority, dueDate: c.dueDate, assignee: c.assignee,
      isCompleted: c.isCompleted, labels: c.labels, commentCount: c.comments.length, updatedAt: c.updatedAt,
    };
  }

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  drop(event: CdkDragDrop<CardSummaryDto[]>): void {
    const fromId = event.previousContainer.id;
    const toId = event.container.id;
    if (fromId === toId && event.previousIndex === event.currentIndex) return;

    const card = event.item.data as CardSummaryDto;
    const cols = this.columns();
    const toCol = cols.find((c) => c.id === toId);
    if (!toCol) return;

    // Build the destination order without the moved card, then read neighbours at the drop index.
    const destCards = toCol.cards.filter((c) => c.id !== card.id);
    const index = Math.min(event.currentIndex, destCards.length);
    const prev = destCards[index - 1];
    const next = destCards[index];
    const position = prev && next ? (prev.position + next.position) / 2 : prev ? prev.position + 1 : next ? next.position - 1 : 1;

    const moved: CardSummaryDto = { ...card, columnId: toId, position, isCompleted: toCol.isDone };

    // Optimistic update.
    this.columns.set(
      cols.map((c) => {
        if (c.id === fromId && c.id === toId) {
          const arr = [...destCards];
          arr.splice(index, 0, moved);
          return { ...c, cards: arr };
        }
        if (c.id === fromId) return { ...c, cards: c.cards.filter((x) => x.id !== card.id) };
        if (c.id === toId) {
          const arr = [...destCards];
          arr.splice(index, 0, moved);
          return { ...c, cards: arr };
        }
        return c;
      }),
    );

    this.cardApi.move(card.id, toId, position).subscribe({ error: () => this.reload() });
  }
}
