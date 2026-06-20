import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { DemoService } from '../../core/demo/demo.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TPipe } from '../../core/i18n/t.pipe';

interface Rect { top: number; left: number; width: number; height: number; }

/** Coach-mark tour: dims the page, spotlights the current step's target and shows a tooltip card. */
@Component({
  selector: 'tf-tour',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TPipe],
  template: `
    @if (demo.tourActive()) {
      <div class="fixed inset-0 z-[100]">
        @if (rect(); as r) {
          <!-- Spotlight: a transparent box whose huge shadow dims everything else -->
          <div class="absolute rounded-xl transition-all duration-200 pointer-events-none ring-2 ring-accent-500"
            [style.top.px]="r.top - 6" [style.left.px]="r.left - 6"
            [style.width.px]="r.width + 12" [style.height.px]="r.height + 12"
            style="box-shadow: 0 0 0 9999px rgba(15,16,20,.62)"></div>
        } @else {
          <div class="absolute inset-0 bg-ink-900/65"></div>
        }

        <!-- Tooltip card -->
        <div class="absolute w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 shadow-2xl p-5"
          [style.top.px]="cardPos().top" [style.left.px]="cardPos().left">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-mono num text-accent-600">{{ demo.stepIndex() + 1 }} / {{ demo.steps.length }}</span>
            <button (click)="demo.endTour()" class="text-xs font-semibold text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors">{{ 'demo.skip' | t }}</button>
          </div>
          <h3 class="text-base font-semibold">{{ es() ? step().title.es : step().title.en }}</h3>
          <p class="text-sm text-ink-500 dark:text-ink-400 mt-1.5 leading-relaxed">{{ es() ? step().body.es : step().body.en }}</p>
          <div class="flex items-center gap-2 mt-4">
            @if (demo.stepIndex() > 0) {
              <button (click)="demo.prev()" class="text-sm font-semibold text-ink-500 hover:text-ink-900 dark:hover:text-white rounded-lg px-3 py-1.5 transition-colors">{{ 'demo.back' | t }}</button>
            }
            <span class="flex-1"></span>
            <button (click)="demo.next()" class="rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold px-4 py-1.5 transition-colors">
              {{ last() ? ('demo.finish' | t) : ('demo.next' | t) }}
            </button>
          </div>
          <!-- step dots -->
          <div class="flex justify-center gap-1.5 mt-4">
            @for (s of demo.steps; track $index) {
              <span class="w-1.5 h-1.5 rounded-full transition-colors" [class]="$index === demo.stepIndex() ? 'bg-accent-600' : 'bg-ink-200 dark:bg-ink-600'"></span>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class TourComponent {
  readonly demo = inject(DemoService);
  private readonly i18n = inject(I18nService);

  readonly rect = signal<Rect | null>(null);
  readonly cardPos = signal<{ top: number; left: number }>({ top: 80, left: 80 });

  readonly step = computed(() => this.demo.steps[this.demo.stepIndex()]);
  readonly last = computed(() => this.demo.stepIndex() === this.demo.steps.length - 1);
  readonly es = () => this.i18n.lang() === 'es';

  constructor() {
    effect(() => {
      // Re-measure whenever the tour opens or advances.
      this.demo.tourActive();
      this.demo.stepIndex();
      setTimeout(() => this.measure(), 60);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.demo.tourActive()) this.measure();
  }

  private measure(): void {
    const target = this.step().target;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (!target) {
      this.rect.set(null);
      this.cardPos.set({ top: Math.max(24, vh / 2 - 130), left: Math.max(12, vw / 2 - 160) });
      return;
    }

    const el = document.querySelector(target) as HTMLElement | null;
    if (!el) {
      this.rect.set(null);
      this.cardPos.set({ top: Math.max(24, vh / 2 - 130), left: Math.max(12, vw / 2 - 160) });
      return;
    }

    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const b = el.getBoundingClientRect();
    this.rect.set({ top: b.top, left: b.left, width: b.width, height: b.height });

    const cardW = 320;
    const cardH = 210;
    // Prefer below the target; flip above if it would overflow.
    let top = b.bottom + 14;
    if (top + cardH > vh) top = Math.max(14, b.top - cardH - 14);
    let left = b.left;
    if (left + cardW > vw - 12) left = vw - cardW - 12;
    left = Math.max(12, left);
    this.cardPos.set({ top, left });
  }
}
