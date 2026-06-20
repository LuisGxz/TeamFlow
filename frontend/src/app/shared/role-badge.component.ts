import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';
import { WorkspaceRole } from '../core/models/models';

/** Small colored pill for a workspace role, translated EN/ES. */
@Component({
  selector: 'tf-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (role()) {
      <span class="inline-block text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none" [class]="cls()">
        {{ label() }}
      </span>
    }
  `,
})
export class RoleBadgeComponent {
  readonly role = input<WorkspaceRole | null>(null);

  constructor(private readonly i18n: I18nService) {}

  readonly label = computed(() => (this.role() ? this.i18n.t(`role.${this.role()}`) : ''));

  readonly cls = computed(() => {
    switch (this.role()) {
      case 'Owner':
        return 'bg-accent-100 text-accent-700 dark:bg-accent-600/25 dark:text-accent-200';
      case 'Admin':
        return 'bg-warn/15 text-warn dark:bg-warn/20';
      case 'Member':
        return 'bg-ink-100 text-ink-600 dark:bg-ink-700 dark:text-ink-300';
      default:
        return 'bg-ink-100 text-ink-500 dark:bg-ink-700 dark:text-ink-400';
    }
  });
}
