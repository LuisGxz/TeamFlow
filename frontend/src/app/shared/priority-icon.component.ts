import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Priority } from '../core/models/models';

/** Renders the priority glyph (Linear-style signal bars / urgent octagon) with its colour. */
@Component({
  selector: 'tf-priority-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `<lucide-icon [name]="icon()" [class]="cls()"></lucide-icon>`,
})
export class PriorityIconComponent {
  readonly priority = input<Priority>('None');
  readonly size = input<string>('w-3.5 h-3.5');

  readonly icon = computed(() => {
    switch (this.priority()) {
      case 'Urgent': return 'alert-octagon';
      case 'High': return 'signal-high';
      case 'Medium': return 'signal-medium';
      case 'Low': return 'signal-low';
      default: return 'minus';
    }
  });

  readonly cls = computed(() => {
    const color =
      this.priority() === 'Urgent' ? 'text-urgent'
      : this.priority() === 'High' ? 'text-warn'
      : this.priority() === 'Medium' ? 'text-ink-400'
      : 'text-ink-300';
    return `${this.size()} ${color}`;
  });
}
