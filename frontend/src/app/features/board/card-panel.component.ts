import { ChangeDetectionStrategy, Component, OnChanges, OnInit, SimpleChanges, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { LucideAngularModule } from 'lucide-angular';
import { CardApi, UpdateCardBody } from '../../core/api/card.api';
import { WorkspaceApi } from '../../core/api/workspace.api';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';
import { BoardDetailDto, CardDetailDto, MemberDto, Priority } from '../../core/models/models';
import { AvatarComponent } from '../../shared/avatar.component';
import { PriorityIconComponent } from '../../shared/priority-icon.component';

const PRIORITIES: Priority[] = ['Urgent', 'High', 'Medium', 'Low', 'None'];

@Component({
  selector: 'tf-card-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule, CdkMenuTrigger, CdkMenu, CdkMenuItem,
    LucideAngularModule, TPipe, AvatarComponent, PriorityIconComponent,
  ],
  template: `
    <div class="fixed inset-0 z-50 flex justify-end" (keydown.escape)="closed.emit()">
      <div class="absolute inset-0 bg-ink-900/30 backdrop-blur-[1px]" (click)="closed.emit()"></div>

      <aside class="relative w-full sm:w-[420px] h-full bg-white dark:bg-ink-800 border-l border-ink-200 dark:border-ink-700 shadow-2xl flex flex-col animate-[slidein_.18s_ease]">
        @if (loading()) {
          <div class="grid place-items-center flex-1"><lucide-icon name="loader" class="w-6 h-6 animate-spin text-accent-600"></lucide-icon></div>
        } @else if (card(); as c) {
          <!-- header -->
          <header class="flex items-center gap-1 px-4 py-3 border-b border-ink-200 dark:border-ink-700">
            <span class="font-mono text-xs text-ink-500">{{ c.reference }}</span>
            @if (c.isCompleted) {
              <span class="ml-1 inline-flex items-center gap-1 text-[10px] font-semibold text-done"><lucide-icon name="check-circle-2" class="w-3.5 h-3.5"></lucide-icon>{{ 'board.done' | t }}</span>
            }
            <div class="ml-auto flex gap-0.5">
              <button (click)="copyLink()" class="w-8 h-8 rounded-lg grid place-items-center text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors" [title]="'Copy link'"><lucide-icon name="link" class="w-4 h-4"></lucide-icon></button>
              @if (canEdit()) {
                <button (click)="remove(c)" class="w-8 h-8 rounded-lg grid place-items-center text-ink-500 hover:bg-urgent/10 hover:text-urgent transition-colors" [title]="('card.delete' | t)"><lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon></button>
              }
              <button (click)="closed.emit()" class="w-8 h-8 rounded-lg grid place-items-center text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors" title="Close"><lucide-icon name="x" class="w-4 h-4"></lucide-icon></button>
            </div>
          </header>

          <div class="flex-1 overflow-y-auto p-5">
            <!-- title -->
            @if (canEdit()) {
              <textarea name="title" rows="1" [(ngModel)]="titleDraft" (blur)="saveTitle(c)"
                class="w-full text-lg font-semibold bg-transparent outline-none resize-none mb-4 focus:bg-ink-50 dark:focus:bg-ink-900 rounded-lg px-1 -mx-1 py-0.5 transition-colors"></textarea>
            } @else {
              <h2 class="text-lg font-semibold mb-4" [class.line-through]="c.isCompleted">{{ c.title }}</h2>
            }

            <!-- properties -->
            <dl class="space-y-2.5 text-sm mb-6">
              <!-- status -->
              <div class="flex items-center gap-3">
                <dt class="w-24 text-ink-500 text-xs shrink-0">{{ 'card.status' | t }}</dt>
                <dd>
                  <button [cdkMenuTriggerFor]="statusMenu" [disabled]="!canEdit()" [class]="propPill">
                    <span class="w-2 h-2 rounded-full" [style.background]="columnIsDone(c.columnId) ? '#26A269' : '#5B5BD6'"></span>
                    {{ columnName(c.columnId) }}
                  </button>
                </dd>
              </div>
              <!-- priority -->
              <div class="flex items-center gap-3">
                <dt class="w-24 text-ink-500 text-xs shrink-0">{{ 'card.priority' | t }}</dt>
                <dd>
                  <button [cdkMenuTriggerFor]="priorityMenu" [disabled]="!canEdit()" [class]="propPill">
                    <tf-priority-icon [priority]="c.priority"></tf-priority-icon>{{ ('priority.' + c.priority) | t }}
                  </button>
                </dd>
              </div>
              <!-- assignee -->
              <div class="flex items-center gap-3">
                <dt class="w-24 text-ink-500 text-xs shrink-0">{{ 'card.assignee' | t }}</dt>
                <dd>
                  <button [cdkMenuTriggerFor]="assigneeMenu" [disabled]="!canEdit()" [class]="propPill">
                    @if (c.assignee) {
                      <tf-avatar [name]="c.assignee.displayName" [hue]="c.assignee.avatarHue" size="sm"></tf-avatar>{{ c.assignee.displayName }}
                    } @else {
                      <lucide-icon name="circle-user" class="w-4 h-4 text-ink-400"></lucide-icon>{{ 'card.unassigned' | t }}
                    }
                  </button>
                </dd>
              </div>
              <!-- due date -->
              <div class="flex items-center gap-3">
                <dt class="w-24 text-ink-500 text-xs shrink-0">{{ 'card.dueDate' | t }}</dt>
                <dd>
                  @if (canEdit()) {
                    <input type="date" [ngModel]="c.dueDate" (ngModelChange)="setDue($event)" name="due"
                      class="text-xs num bg-transparent border border-ink-200 dark:border-ink-700 rounded-md px-2 py-1 outline-none focus:border-accent-600 transition-colors" />
                  } @else {
                    <span class="text-xs num">{{ c.dueDate ? (c.dueDate | date: 'mediumDate') : ('card.noDate' | t) }}</span>
                  }
                </dd>
              </div>
              <!-- labels -->
              <div class="flex items-start gap-3">
                <dt class="w-24 text-ink-500 text-xs shrink-0 pt-1">{{ 'card.labels' | t }}</dt>
                <dd class="flex flex-wrap gap-1.5 items-center">
                  @for (lbl of c.labels; track lbl.id) {
                    <span class="text-[11px] font-semibold rounded-full px-2 py-0.5 leading-none" [style.background]="lbl.color + '22'" [style.color]="lbl.color">{{ lbl.name }}</span>
                  }
                  @if (canEdit() && board().labels.length > 0) {
                    <button [cdkMenuTriggerFor]="labelMenu" class="text-[11px] font-semibold rounded-full px-2 py-0.5 border border-dashed border-ink-300 dark:border-ink-600 text-ink-500 hover:border-accent-600 transition-colors flex items-center gap-1">
                      <lucide-icon name="tag" class="w-3 h-3"></lucide-icon>{{ i18n.lang() === 'es' ? 'Editar' : 'Edit' }}
                    </button>
                  }
                </dd>
              </div>
            </dl>

            <!-- description -->
            <div class="mb-6">
              <p class="text-xs font-semibold text-ink-500 mb-1.5">{{ 'card.description' | t }}</p>
              @if (canEdit()) {
                <textarea name="desc" rows="4" [(ngModel)]="descDraft" (blur)="saveDesc(c)"
                  [placeholder]="('card.noDescription' | t)"
                  class="w-full text-sm leading-relaxed bg-ink-50 dark:bg-ink-900 rounded-lg px-3 py-2.5 outline-none focus:ring-1 ring-accent-600 resize-none transition-shadow"></textarea>
              } @else {
                <p class="text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-wrap">{{ c.description || ('card.noDescription' | t) }}</p>
              }
            </div>

            <!-- comments -->
            <div class="border-t border-ink-200 dark:border-ink-700 pt-4">
              <p class="text-xs font-semibold text-ink-500 mb-3 num">{{ 'card.comments' | t }} · {{ c.comments.length }}</p>
              <div class="space-y-3 mb-4">
                @for (cm of c.comments; track cm.id) {
                  <div class="flex gap-2.5 group">
                    <tf-avatar [name]="cm.author.displayName" [hue]="cm.author.avatarHue" size="md"></tf-avatar>
                    <div class="min-w-0 flex-1">
                      <p class="text-xs"><strong>{{ cm.author.displayName }}</strong> <span class="text-ink-400 num">· {{ cm.createdAt | date: 'short' }}</span></p>
                      <p class="text-sm text-ink-700 dark:text-ink-200 mt-0.5 whitespace-pre-wrap">{{ cm.body }}</p>
                    </div>
                    @if (canDeleteComment(cm.author.id)) {
                      <button (click)="deleteComment(cm.id)" class="opacity-0 group-hover:opacity-100 w-6 h-6 rounded grid place-items-center text-ink-400 hover:text-urgent transition-all" title="Delete"><lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon></button>
                    }
                  </div>
                } @empty {
                  <p class="text-xs text-ink-400">{{ 'card.noComments' | t }}</p>
                }
              </div>
              @if (canEdit()) {
                <div class="flex gap-2.5">
                  <tf-avatar [name]="me()?.displayName ?? ''" [hue]="me()?.avatarHue ?? 240" size="md"></tf-avatar>
                  <div class="flex-1">
                    <textarea name="newComment" rows="2" [(ngModel)]="commentDraft"
                      [placeholder]="('card.addComment' | t)"
                      class="w-full text-sm rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 outline-none focus:border-accent-600 transition-colors resize-none"></textarea>
                    @if (commentDraft().trim()) {
                      <button (click)="addComment(c)" [disabled]="posting()" class="mt-1.5 rounded-md bg-accent-600 hover:bg-accent-500 text-white text-xs font-semibold px-3 py-1.5 transition-colors">{{ 'card.send' | t }}</button>
                    }
                  </div>
                </div>
              } @else {
                <p class="text-[11px] text-ink-400 italic">{{ 'card.readOnly' | t }}</p>
              }
            </div>
          </div>
        }
      </aside>
    </div>

    <!-- Menus -->
    <ng-template #statusMenu>
      <div cdkMenu [class]="menuPanel">
        @for (col of board().columns; track col.id) {
          <button cdkMenuItem (click)="moveTo(col.id)" [class]="menuItem">
            <span class="w-2 h-2 rounded-full" [style.background]="col.isDone ? '#26A269' : '#5B5BD6'"></span>{{ col.name }}
            @if (card()?.columnId === col.id) { <lucide-icon name="check" class="w-4 h-4 ml-auto text-accent-600"></lucide-icon> }
          </button>
        }
      </div>
    </ng-template>

    <ng-template #priorityMenu>
      <div cdkMenu [class]="menuPanel">
        @for (p of priorities; track p) {
          <button cdkMenuItem (click)="setPriority(p)" [class]="menuItem">
            <tf-priority-icon [priority]="p"></tf-priority-icon>{{ ('priority.' + p) | t }}
          </button>
        }
      </div>
    </ng-template>

    <ng-template #assigneeMenu>
      <div cdkMenu class="max-h-64 overflow-y-auto" [class]="menuPanel">
        <button cdkMenuItem (click)="setAssignee(null)" [class]="menuItem">
          <lucide-icon name="circle-user" class="w-4 h-4 text-ink-400"></lucide-icon>{{ 'card.unassigned' | t }}
        </button>
        @for (m of members(); track m.userId) {
          <button cdkMenuItem (click)="setAssignee(m.userId)" [class]="menuItem">
            <tf-avatar [name]="m.displayName" [hue]="m.avatarHue" size="sm"></tf-avatar>{{ m.displayName }}
          </button>
        }
      </div>
    </ng-template>

    <ng-template #labelMenu>
      <div cdkMenu class="max-h-64 overflow-y-auto" [class]="menuPanel">
        @for (lbl of board().labels; track lbl.id) {
          <button cdkMenuItem (click)="toggleLabel(lbl.id)" [class]="menuItem">
            <span class="w-3 h-3 rounded-full" [style.background]="lbl.color"></span>{{ lbl.name }}
            @if (hasLabel(lbl.id)) { <lucide-icon name="check" class="w-4 h-4 ml-auto text-accent-600"></lucide-icon> }
          </button>
        }
      </div>
    </ng-template>
  `,
  styles: [`
    @keyframes slidein { from { transform: translateX(20px); opacity: .6 } to { transform: translateX(0); opacity: 1 } }
  `],
})
export class CardPanelComponent implements OnInit, OnChanges {
  private readonly cardApi = inject(CardApi);
  private readonly workspaceApi = inject(WorkspaceApi);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly cardId = input.required<string>();
  readonly board = input.required<BoardDetailDto>();
  readonly canEdit = input<boolean>(false);

  readonly closed = output<void>();
  readonly changed = output<void>();

  readonly card = signal<CardDetailDto | null>(null);
  readonly loading = signal(true);
  readonly members = signal<MemberDto[]>([]);
  readonly titleDraft = signal('');
  readonly descDraft = signal('');
  readonly commentDraft = signal('');
  readonly posting = signal(false);

  readonly priorities = PRIORITIES;
  readonly me = this.auth.user;

  // Shared utility-class strings (kept here to avoid @apply in component styles, which needs @reference under Tailwind v4).
  readonly propPill = 'inline-flex items-center gap-1.5 text-xs font-medium rounded-md px-2 py-1 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors disabled:hover:bg-transparent disabled:cursor-default';
  readonly menuPanel = 'min-w-[200px] rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 shadow-lg p-1.5';
  readonly menuItem = 'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors outline-none';

  ngOnInit(): void {
    this.workspaceApi.members().subscribe({ next: (m) => this.members.set(m), error: () => {} });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cardId']) this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    this.cardApi.get(this.cardId()).subscribe({
      next: (c) => {
        this.card.set(c);
        this.titleDraft.set(c.title);
        this.descDraft.set(c.description);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.closed.emit();
      },
    });
  }

  columnName(columnId: string): string {
    return this.board().columns.find((c) => c.id === columnId)?.name ?? '—';
  }
  columnIsDone(columnId: string): boolean {
    return this.board().columns.find((c) => c.id === columnId)?.isDone ?? false;
  }
  hasLabel(labelId: string): boolean {
    return this.card()?.labels.some((l) => l.id === labelId) ?? false;
  }
  canDeleteComment(authorId: string): boolean {
    return this.canEdit() && (authorId === this.me()?.id || this.auth.currentWorkspace()?.role === 'Admin' || this.auth.currentWorkspace()?.role === 'Owner');
  }

  // ── Mutations ────────────────────────────────────────────────────────────

  private patch(partial: Partial<UpdateCardBody>): void {
    const c = this.card();
    if (!c) return;
    const body: UpdateCardBody = {
      title: partial.title ?? c.title,
      description: partial.description !== undefined ? partial.description : c.description,
      priority: partial.priority ?? c.priority,
      dueDate: partial.dueDate !== undefined ? partial.dueDate : c.dueDate,
      assigneeId: partial.assigneeId !== undefined ? partial.assigneeId : c.assignee?.id ?? null,
    };
    this.cardApi.update(c.id, body).subscribe({ next: (u) => this.applyUpdate(u) });
  }

  saveTitle(c: CardDetailDto): void {
    const t = this.titleDraft().trim();
    if (t && t !== c.title) this.patch({ title: t });
  }
  saveDesc(c: CardDetailDto): void {
    if (this.descDraft() !== c.description) this.patch({ description: this.descDraft() });
  }
  setPriority(p: Priority): void {
    this.patch({ priority: p });
  }
  setAssignee(userId: string | null): void {
    this.patch({ assigneeId: userId });
  }
  setDue(value: string | null): void {
    this.patch({ dueDate: value || null });
  }

  moveTo(columnId: string): void {
    const c = this.card();
    if (!c || c.columnId === columnId) return;
    const target = this.board().columns.find((x) => x.id === columnId);
    const endPos = (target?.cards.reduce((m, k) => Math.max(m, k.position), 0) ?? 0) + 1;
    this.cardApi.move(c.id, columnId, endPos).subscribe({ next: (u) => this.applyUpdate(u) });
  }

  toggleLabel(labelId: string): void {
    const c = this.card();
    if (!c) return;
    const ids = c.labels.map((l) => l.id);
    const next = ids.includes(labelId) ? ids.filter((x) => x !== labelId) : [...ids, labelId];
    this.cardApi.setLabels(c.id, next).subscribe({ next: (u) => this.applyUpdate(u) });
  }

  addComment(c: CardDetailDto): void {
    const body = this.commentDraft().trim();
    if (!body || this.posting()) return;
    this.posting.set(true);
    this.cardApi.addComment(c.id, body).subscribe({
      next: (comment) => {
        this.card.update((cur) => (cur ? { ...cur, comments: [...cur.comments, comment] } : cur));
        this.commentDraft.set('');
        this.posting.set(false);
        this.changed.emit();
      },
      error: () => this.posting.set(false),
    });
  }

  deleteComment(commentId: string): void {
    this.cardApi.deleteComment(commentId).subscribe({
      next: () => {
        this.card.update((cur) => (cur ? { ...cur, comments: cur.comments.filter((x) => x.id !== commentId) } : cur));
        this.changed.emit();
      },
    });
  }

  remove(c: CardDetailDto): void {
    if (!confirm(this.i18n.t('card.deleteConfirm'))) return;
    this.cardApi.remove(c.id).subscribe({
      next: () => {
        this.changed.emit();
        this.closed.emit();
      },
    });
  }

  copyLink(): void {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  }

  private applyUpdate(updated: CardDetailDto): void {
    this.card.set(updated);
    this.titleDraft.set(updated.title);
    this.descDraft.set(updated.description);
    this.changed.emit();
  }
}
