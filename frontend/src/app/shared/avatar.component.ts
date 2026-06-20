import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Initials avatar with a stable, per-user hue. Sizes: sm 20px, md 24px, lg 32px. */
@Component({
  selector: 'tf-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-grid place-items-center rounded-full font-bold text-white shrink-0 select-none"
      [class]="sizeClass()"
      [style.background]="background()"
      [attr.title]="name()"
    >
      {{ initials() }}
    </span>
  `,
})
export class AvatarComponent {
  readonly name = input<string>('');
  readonly hue = input<number>(240);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly background = computed(() => `hsl(${this.hue()} 55% 52%)`);

  readonly sizeClass = computed(() => {
    switch (this.size()) {
      case 'sm':
        return 'w-5 h-5 text-[9px]';
      case 'lg':
        return 'w-8 h-8 text-xs';
      default:
        return 'w-6 h-6 text-[10px]';
    }
  });
}
